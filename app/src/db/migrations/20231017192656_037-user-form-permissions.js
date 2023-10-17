// Having performance problems and these views seem to be a cause of it.
// 1. Remove the join of "role" in user_form_permissions_vw.
// 2. Remove the join of "role" in user_form_roles_vw.
// 3. Simplify the EXISTS SELECT in user_form_permissions_vw.
// 4. Simplify the EXISTS SELECT in user_form_roles_vw.
// 5. Remove the sorting in the user_form_access_vw.

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('user_form_access_vw'))
    .then(() => knex.schema.dropViewIfExists('user_form_permissions_vw'))
    .then(() => knex.schema.dropViewIfExists('user_form_roles_vw'))
    .then(() =>
      knex.schema.raw(`CREATE OR REPLACE VIEW public.user_form_roles_vw
      AS SELECT fru."userId",
          fru."formId",
          array_agg(DISTINCT fru.role) AS roles
         FROM form_role_user fru
        GROUP BY fru."userId", fru."formId"
      UNION
       SELECT u2.id AS "userId",
          f2.id AS "formId",
          '{}'::character varying[] AS roles
         FROM form_vw f2,
          "user" u2
        WHERE NOT EXISTS (
          SELECT 1 FROM form_role_user fru2
          WHERE fru2."formId" = f2.id AND fru2."userId" = u2.id);`)
    )
    .then(() =>
      knex.schema.raw(`CREATE OR REPLACE VIEW public.user_form_permissions_vw
        AS SELECT fru."userId",
            fru."formId",
            array_agg(DISTINCT p.code) AS permissions
           FROM form_role_user fru
             JOIN role_permission rp ON fru.role::text = rp.role::text
             JOIN permission p ON rp.permission::text = p.code::text
          GROUP BY fru."userId", fru."formId"
        UNION
         SELECT u2.id AS "userId",
            f2.id AS "formId",
            '{submission_create,form_read}'::character varying[] AS permissions
           FROM form_vw f2,
            "user" u2
          WHERE NOT EXISTS (
            SELECT 1 FROM form_role_user fru2
            WHERE fru2."formId" = f2.id AND fru2."userId" = u2.id);`)
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
          f.description AS "formDescription"
         FROM "user" u
           JOIN user_form_roles_vw r ON u.id = r."userId"
           JOIN user_form_permissions_vw p ON r."userId" = p."userId" AND r."formId" = p."formId"
           JOIN form_vw f ON f.id = p."formId";`)
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('user_form_access_vw'))
    .then(() => knex.schema.dropViewIfExists('user_form_permissions_vw'))
    .then(() => knex.schema.dropViewIfExists('user_form_roles_vw'))
    .then(() =>
      knex.schema.raw(`CREATE OR REPLACE VIEW public.user_form_roles_vw
      AS SELECT fru."userId",
          fru."formId",
          array_agg(DISTINCT r.code) AS roles
         FROM form_role_user fru
           JOIN role r ON fru.role::text = r.code::text
        GROUP BY fru."userId", fru."formId"
      UNION
       SELECT u2.id AS "userId",
          f2.id AS "formId",
          '{}'::character varying[] AS roles
         FROM form_vw f2,
          "user" u2
        WHERE NOT (EXISTS ( SELECT fru2.id,
                  fru2.role,
                  fru2."formId",
                  fru2."userId",
                  fru2."createdBy",
                  fru2."createdAt",
                  fru2."updatedBy",
                  fru2."updatedAt"
                 FROM form_role_user fru2
                WHERE fru2."formId" = f2.id AND fru2."userId" = u2.id));`)
    )
    .then(() =>
      knex.schema.raw(`
        CREATE OR REPLACE VIEW public.user_form_permissions_vw
        AS SELECT fru."userId",
            fru."formId",
            array_agg(DISTINCT p.code) AS permissions
           FROM form_role_user fru
             JOIN role r ON fru.role::text = r.code::text
             JOIN role_permission rp ON r.code::text = rp.role::text
             JOIN permission p ON rp.permission::text = p.code::text
          GROUP BY fru."userId", fru."formId"
        UNION
         SELECT u2.id AS "userId",
            f2.id AS "formId",
            '{submission_create,form_read}'::character varying[] AS permissions
           FROM form_vw f2,
            "user" u2
          WHERE NOT (EXISTS ( SELECT fru2.id,
                    fru2.role,
                    fru2."formId",
                    fru2."userId",
                    fru2."createdBy",
                    fru2."createdAt",
                    fru2."updatedBy",
                    fru2."updatedAt"
                   FROM form_role_user fru2
                  WHERE fru2."formId" = f2.id AND fru2."userId" = u2.id));`)
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
          f.description AS "formDescription"
         FROM "user" u
           JOIN user_form_roles_vw r ON u.id = r."userId"
           JOIN user_form_permissions_vw p ON r."userId" = p."userId" AND r."formId" = p."formId"
           JOIN form_vw f ON f.id = p."formId"
        ORDER BY (lower(u."lastName"::text)), (lower(u."firstName"::text)), (lower(f.name::text));`)
    );
};
