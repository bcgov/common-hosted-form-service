/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.alterTable('form', (table) => {
        table.boolean('enableOfflineSubmission').notNullable().defaultTo(false).comment('When true, submitters can queue submissions while offline and sync them on reconnect');
      })
    )
    .then(() =>
      knex.schema.alterTable('form_submission', (table) => {
        table.timestamp('queuedAt', { useTz: true }).comment('When the user clicked Submit on their device; NULL for live (non-queued) submissions');
        table.uuid('dedupKey').comment('Client-supplied UUID for safe retries from the offline queue; NULL for live (non-queued) submissions.');
        table.unique(['dedupKey']);
      })
    )
    .then(() =>
      // Widen form_vw + user_form_access_vw so rbac surfaces enableOfflineSubmission.
      knex.schema.raw(`CREATE OR REPLACE VIEW public.form_vw
      AS SELECT DISTINCT ON ((lower(f.name::text)), fv.version, f.id) f.id,
          f.name,
          f.active,
          f.description,
          f.labels,
          f."createdAt",
          f."createdBy",
          f."updatedAt",
          f."updatedBy",
          fv.id AS "formVersionId",
          fv.version,
              CASE
                  WHEN count(fip.code) = 0 THEN '{}'::character varying[]
                  ELSE array_agg(DISTINCT fip.code)
              END AS "identityProviders",
              CASE
                  WHEN count(ip.idp) = 0 THEN '{}'::character varying[]
                  ELSE array_agg(DISTINCT ip.idp)
              END AS idps,
          fv.published,
          fv."updatedAt" AS "versionUpdatedAt",
          f."allowSubmitterToUploadFile",
          f."enableOfflineSubmission"
         FROM form f
           LEFT JOIN LATERAL ( SELECT v.id,
                  v."formId",
                  v.version,
                  v.schema,
                  v."createdBy",
                  v."createdAt",
                  v."updatedBy",
                  v."updatedAt",
                  v.published
                 FROM form_version v
                WHERE v."formId" = f.id
                ORDER BY (
                      CASE
                          WHEN v.published THEN 1
                          ELSE 0
                      END) DESC, v.version DESC
               LIMIT 1) fv ON true
           LEFT JOIN form_identity_provider fip ON f.id = fip."formId"
           LEFT JOIN identity_provider ip ON fip.code::text = ip.code::text
        GROUP BY f.id, f.name, f.active, f.description, f.labels, f."createdAt", f."createdBy", f."updatedAt", f."updatedBy", fv.id, fv.version, fv.published, fv."updatedAt"`)
    )
    .then(() =>
      knex.schema.raw(`CREATE OR REPLACE VIEW public.user_form_access_vw
      AS SELECT r."userId",
    u."idpUserId",
    u.username,
    u."fullName",
    u."firstName",
    u."lastName",
    u.email,
    r."formId",
    f.name AS "formName",
    f.labels,
    u."idpCode" AS "user_idpCode",
    f."identityProviders",
    f."identityProviders" AS form_login_required,
    f.idps,
    f.active,
    f."formVersionId",
    f.version,
    r.roles,
    p.permissions,
    f.published,
    f."versionUpdatedAt",
    f.description AS "formDescription",
    ftm."tenantId",
    f."enableOfflineSubmission"
   FROM "user" u
     JOIN user_form_roles_vw r ON u.id = r."userId"
     JOIN user_form_permissions_vw p ON r."userId" = p."userId" AND r."formId" = p."formId"
     JOIN form_vw f ON f.id = p."formId"
     left outer join form_tenant ftm  on f.id = ftm."formId" ;`)
    )
    .then(() => knex.schema.raw('drop view submissions_submitters_vw'))
    .then(() =>
      knex.schema.raw(`create or replace view submissions_submitters_vw as
    SELECT
      fsu.*,
      fv."formId",
      fv."version",
      sub."id",
      sub."confirmationId",
      sub."createdAt",
      sub."updatedAt",
      sub."draft",
      sub."deleted",
      f.name,
      f.description,
      f.active,
      f."enableStatusUpdates",
      f."enableSubmitterDraft",
      f."enableSubmitterRevision",
      f."enableOfflineSubmission"
    FROM
      form_submission_users_vw fsu
    INNER JOIN form_submission sub ON
      sub."id" = fsu."formSubmissionId"
    INNER JOIN form_version fv ON
      fv."id" = sub."formVersionId"
    INNER JOIN form f ON
      fv."formId" = f."id"`)
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('drop view submissions_submitters_vw'))
    .then(() =>
      knex.schema.raw(`create or replace view submissions_submitters_vw as
    SELECT
      fsu.*,
      fv."formId",
      fv."version",
      sub."id",
      sub."confirmationId",
      sub."createdAt",
      sub."updatedAt",
      sub."draft",
      sub."deleted",
      f.name,
      f.description,
      f.active,
      f."enableStatusUpdates",
      f."enableSubmitterDraft",
      f."enableSubmitterRevision"
    FROM
      form_submission_users_vw fsu
    INNER JOIN form_submission sub ON
      sub."id" = fsu."formSubmissionId"
    INNER JOIN form_version fv ON
      fv."id" = sub."formVersionId"
    INNER JOIN form f ON
      fv."formId" = f."id"`)
    )
    .then(() =>
      // CREATE OR REPLACE can't drop columns; DROP CASCADE + recreate the views.
      knex.schema.raw('DROP VIEW IF EXISTS form_vw CASCADE')
    )
    .then(() =>
      knex.schema.raw(`CREATE OR REPLACE VIEW public.form_vw
      AS SELECT DISTINCT ON ((lower(f.name::text)), fv.version, f.id) f.id,
          f.name,
          f.active,
          f.description,
          f.labels,
          f."createdAt",
          f."createdBy",
          f."updatedAt",
          f."updatedBy",
          fv.id AS "formVersionId",
          fv.version,
              CASE
                  WHEN count(fip.code) = 0 THEN '{}'::character varying[]
                  ELSE array_agg(DISTINCT fip.code)
              END AS "identityProviders",
              CASE
                  WHEN count(ip.idp) = 0 THEN '{}'::character varying[]
                  ELSE array_agg(DISTINCT ip.idp)
              END AS idps,
          fv.published,
          fv."updatedAt" AS "versionUpdatedAt",
          f."allowSubmitterToUploadFile"
         FROM form f
           LEFT JOIN LATERAL ( SELECT v.id,
                  v."formId",
                  v.version,
                  v.schema,
                  v."createdBy",
                  v."createdAt",
                  v."updatedBy",
                  v."updatedAt",
                  v.published
                 FROM form_version v
                WHERE v."formId" = f.id
                ORDER BY (
                      CASE
                          WHEN v.published THEN 1
                          ELSE 0
                      END) DESC, v.version DESC
               LIMIT 1) fv ON true
           LEFT JOIN form_identity_provider fip ON f.id = fip."formId"
           LEFT JOIN identity_provider ip ON fip.code::text = ip.code::text
        GROUP BY f.id, f.name, f.active, f.description, f.labels, f."createdAt", f."createdBy", f."updatedAt", f."updatedBy", fv.id, fv.version, fv.published, fv."updatedAt"`)
    )
    .then(() =>
      knex.schema.raw(`CREATE OR REPLACE VIEW public.public_form_access_vw
      AS SELECT NULL::text AS "userId",
          NULL::text AS "idpUserId",
          'public'::text AS username,
          'public'::text AS "fullName",
          NULL::text AS "firstName",
          NULL::text AS "lastName",
          NULL::text AS email,
          f.id AS "formId",
          f.name AS "formName",
          f.labels,
          f."identityProviders",
          f.idps,
          f.active,
          f."formVersionId",
          f.version,
          '{}'::character varying[] AS roles,
          '{submission_create,form_read}'::character varying[] AS permissions
         FROM form_vw f
        WHERE 'public'::text = ANY (f.idps::text[])`)
    )
    .then(() =>
      knex.schema.raw(`CREATE OR REPLACE VIEW public.user_form_access_vw
      AS SELECT r."userId",
    u."idpUserId",
    u.username,
    u."fullName",
    u."firstName",
    u."lastName",
    u.email,
    r."formId",
    f.name AS "formName",
    f.labels,
    u."idpCode" AS "user_idpCode",
    f."identityProviders",
    f."identityProviders" AS form_login_required,
    f.idps,
    f.active,
    f."formVersionId",
    f.version,
    r.roles,
    p.permissions,
    f.published,
    f."versionUpdatedAt",
    f.description AS "formDescription",
    ftm."tenantId"
   FROM "user" u
     JOIN user_form_roles_vw r ON u.id = r."userId"
     JOIN user_form_permissions_vw p ON r."userId" = p."userId" AND r."formId" = p."formId"
     JOIN form_vw f ON f.id = p."formId"
     left outer join form_tenant ftm  on f.id = ftm."formId" ;`)
    )
    .then(() =>
      knex.schema.alterTable('form_submission', (table) => {
        table.dropUnique(['dedupKey']);
        table.dropColumn('dedupKey');
        table.dropColumn('queuedAt');
      })
    )
    .then(() =>
      knex.schema.alterTable('form', (table) => {
        table.dropColumn('enableOfflineSubmission');
      })
    );
};
