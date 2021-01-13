
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw(`create or replace view public_form_access_vw as
    select null as "userId", null as "keycloakId", 'public' as username, 'public' as "fullName", null as "firstName", null as "lastName", null as email, f.id as "formId", f.name as "formName", f.description as "formDescription", f.labels, f."identityProviders", f.idps, f.active, f."formVersionId", f.version, '{}'::varchar[] as roles, '{submission_create,form_read}'::varchar[] as permissions
    from form_vw f
    where 'public' = ANY(f."idps")
    order by lower(f.name::text)`));
};

exports.down = function (knex) {
  // Restore original definition of this view from 001-views
  return Promise.resolve()
    .then(() => knex.schema.raw(`create or replace view public_form_access_vw as
    select null as "userId", null as "keycloakId", 'public' as username, 'public' as "fullName", null as "firstName", null as "lastName", null as email, f.id as "formId", f.name as "formName", f.labels, f."identityProviders", f.idps, f.active, f."formVersionId", f.version, '{}'::varchar[] as roles, '{submission_create,form_read}'::varchar[] as permissions
    from form_vw f
    where 'public' = ANY(f."idps")
    order by lower(f.name::text)`));
};
