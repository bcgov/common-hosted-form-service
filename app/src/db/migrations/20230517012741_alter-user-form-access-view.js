exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('user_form_access_vw'))
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
        f."identityProviders" AS "form_login_required",
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
      ORDER BY (lower(u."lastName"::text)), (lower(u."firstName"::text)), (lower(f.name::text))`)
    );
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('user_form_access_vw'))
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
        f."identityProviders",
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
      ORDER BY (lower(u."lastName"::text)), (lower(u."firstName"::text)), (lower(f.name::text))`)
    );
};
