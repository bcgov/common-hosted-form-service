// Having performance problems and these views seem to be a cause of it.
// 1. Remove the sorting in the public_form_access_vw.
// 2. Remove the sorting in the form_vw.

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
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
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
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
        GROUP BY f.id, f.name, f.active, f.description, f.labels, f."createdAt", f."createdBy", f."updatedAt", f."updatedBy", fv.id, fv.version, fv.published, fv."updatedAt"
        ORDER BY (lower(f.name::text)), fv.version DESC, f.id;`)
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
        WHERE 'public'::text = ANY (f.idps::text[])
        ORDER BY (lower(f.name::text));`)
    );
};
