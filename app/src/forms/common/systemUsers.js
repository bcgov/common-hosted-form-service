/**
 * Single source of truth for "is this a real person?" when counting or listing users on
 * the migration page.
 *
 * CHEFS creates a `user` row for anything that presents a token, including
 * non-interactive identities such as the `api` and `gateway` service clients, and
 * `public` for anonymous submitters. Those rows are indistinguishable from people in
 * `form_submission_user`, so counting or listing them inflates the shared-user figures
 * and puts machine accounts in front of the user.
 *
 * The marker is `identity_provider.login` — the same flag the frontend uses to decide
 * which providers get a human sign-in button (see store/identityProviders.js). It is
 * data-driven, so a new service IDP is excluded the moment it is seeded with
 * `login: false`; nothing here needs a hardcoded list of usernames.
 *
 * Scope: this applies to users read out of the CHEFS database. It deliberately does NOT
 * apply to users read from CSTAR (group members), for two reasons:
 *   1. CSTAR has no service-account concept — SSOUser.idpType only ever holds `idir`,
 *      `bceidbasic` or `bceidbusiness`, all of which are people.
 *   2. The vocabularies differ. CSTAR's `idpType` corresponds to CHEFS
 *      `identity_provider.idp` (`bceidbasic`), not `.code` (`bceid-basic`), so matching
 *      CSTAR users against these codes would silently drop every BCeID user.
 */

// Joins `user` and its identity provider onto a query that already exposes a user id.
// `{{userIdCol}}` is replaced with the caller's column reference.
const HUMAN_USER_SQL_JOIN = `
  JOIN "user" hu ON hu.id = {{userIdCol}}
  JOIN identity_provider hip ON hip.code = hu."idpCode"`;

// Keeps only identities a person can actually sign in as.
const HUMAN_USER_SQL_PREDICATE = 'hip.login = true';

/**
 * Builds the join clause for a query whose user id lives in `userIdCol`.
 * @param {string} userIdCol fully-qualified column reference, e.g. `fsu."userId"`
 * @returns {string} SQL to splice into the FROM clause
 */
function humanUserJoin(userIdCol) {
  return HUMAN_USER_SQL_JOIN.replace('{{userIdCol}}', userIdCol);
}

module.exports = {
  HUMAN_USER_SQL_PREDICATE,
  humanUserJoin,
};
