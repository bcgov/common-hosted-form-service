// user_duplicates_vw
//
// Finds user records that may be the same person, so an administrator can
// decide which one to keep and mark the rest stale. Identifies candidates
// only; it marks nothing.
//
// USAGE
//   One row per user record, per duplicate group. Read a group by
//   (canonicalIdp, matchType, matchKey), ordered by lastActivityAt DESC.
//
//   Records already marked stale are kept, so a group stays visible after it
//   has been dealt with. Toggle with isResolved:
//     WHERE NOT "isResolved"   outstanding work only
//     (no filter)              everything, resolved included
//     WHERE "isResolved"       review past decisions
//
//   Filter the view rather than inlining its SQL: groupsForThisUser is a
//   window function and is only correct when the filter is applied outside.
//
// COLUMNS
//   canonicalIdp       IdP the group belongs to.
//   matchType          'username' or 'email'.
//   matchKey           normalized value shared by the group.
//   groupSize          records in the group, stale included.
//   activeInGroup      records in the group not marked stale.
//   isResolved         activeInGroup <= 1: at most one record still active,
//                      so the group needs no further decision.
//   stale              this record's stale marker.
//   groupsForThisUser  groups this record appears in, resolved included.
//                      Greater than 1 means judge it across all of them, not
//                      on the group in front of you.
//   lastActivityAt     GREATEST(last login, updatedAt, createdAt). updatedAt
//                      is set on every authenticated request.
//
// SCOPE
//   Matching is within one canonical IdP, where canonical IdP is
//   COALESCE(identity_provider.extra->>'canonicalCode', code). idir and
//   azureidir match each other; bceid-basic and bceid-business do not.
//   IdPs with login = false are excluded, as are users with no idpCode.
//
//   Matches on username and email. Both are normalized: zero-width characters
//   removed, whitespace runs collapsed, trimmed, lowercased, blanks nulled.
//   The bcservicescard literal 'anonymous' is treated as blank.
//
// LIMITS
//   Does not match the same person across different IdPs.
//   Does not report what a record still owns. Seven tables reference user.id,
//   and createdBy/updatedBy are unconstrained strings. Marking stale is safe;
//   deleting is not.
//   IDIR recycles usernames, so a username match can be two different people.
//   Names in different Unicode normalization forms do not match; closing that
//   requires normalize(), which needs PostgreSQL 13.
const CREATE_USER_DUPLICATES_VW = `CREATE OR REPLACE VIEW public.user_duplicates_vw AS
WITH idp AS (
  SELECT code, COALESCE(extra->>'canonicalCode', code) AS canonical_code
    FROM identity_provider
   WHERE login = true
), base AS (
  SELECT u.id,
    u.username,
    u."fullName",
    u.email,
    u."idpCode",
    u.stale,
    u."createdAt",
    i.canonical_code AS "canonicalIdp",
    GREATEST(COALESCE(lh."lastLoginAt", '-infinity'::timestamptz), u."updatedAt", u."createdAt") AS last_activity,
    nullif(nullif(lower(btrim(regexp_replace(regexp_replace(COALESCE(u.username, ''), '[\\u200b\\u2060\\ufeff]', '', 'g'), '[\\s\\u00a0\\u0085\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]+', ' ', 'g'))), ''), 'anonymous') AS username_key,
    nullif(lower(btrim(regexp_replace(regexp_replace(COALESCE(u.email, ''), '[\\u200b\\u2060\\ufeff]', '', 'g'), '[\\s\\u00a0\\u0085\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]+', ' ', 'g'))), '') AS email_key
   FROM "user" u
     JOIN idp i ON i.code = u."idpCode"
     LEFT JOIN (
       SELECT "userId", max("lastLoginAt") AS "lastLoginAt"
         FROM user_login_history GROUP BY "userId"
     ) lh ON lh."userId" = u.id
), keyed AS (
  SELECT 'username'::text AS "matchType", b.username_key AS "matchKey", b.*
    FROM base b WHERE b.username_key IS NOT NULL
  UNION ALL
  SELECT 'email', b.email_key, b.* FROM base b WHERE b.email_key IS NOT NULL
), groups AS (
  SELECT k."canonicalIdp",
    k."matchType",
    k."matchKey",
    count(*)::int AS "groupSize",
    count(*) FILTER (WHERE NOT k.stale)::int AS "activeInGroup"
   FROM keyed k
   GROUP BY 1, 2, 3
  HAVING count(*) > 1
)
SELECT k."canonicalIdp",
  k."matchType",
  k."matchKey",
  g."groupSize",
  g."activeInGroup",
  g."activeInGroup" <= 1 AS "isResolved",
  count(*) OVER (PARTITION BY k.id)::int AS "groupsForThisUser",
  k.id AS "userId",
  k.username,
  k."fullName",
  k.email,
  k."idpCode",
  k.stale,
  k.last_activity AS "lastActivityAt",
  k."createdAt"
 FROM keyed k
   JOIN groups g
     ON g."canonicalIdp" = k."canonicalIdp"
    AND g."matchType" = k."matchType"
    AND g."matchKey" = k."matchKey";`;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('user_duplicates_bcsc_vw'))
    .then(() => knex.schema.dropViewIfExists('user_duplicates_coverage_vw'))
    .then(() => knex.schema.dropViewIfExists('user_duplicates_summary_vw'))
    .then(() => knex.schema.dropViewIfExists('user_duplicates_vw'))
    .then(() => knex.schema.raw(CREATE_USER_DUPLICATES_VW));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('user_duplicates_bcsc_vw'))
    .then(() => knex.schema.dropViewIfExists('user_duplicates_coverage_vw'))
    .then(() => knex.schema.dropViewIfExists('user_duplicates_summary_vw'))
    .then(() => knex.schema.dropViewIfExists('user_duplicates_vw'));
};
