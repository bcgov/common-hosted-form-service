
exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw(`create view user_form_permissions_vw
            ("id", "keycloakId", username, "fullName", "firstName", "lastName", email, "formId", "formName", public, active, "formVersionId", version, permissions)
as
select u.id, u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, f.id as "formId", f.name as "formName", f.public, f.active, f.form_version_id as "formVersionId", f.version, array_agg(p.name) as permissions
from form_role_user fru
inner join "user" u on fru."userId" = u.id
inner join (select distinct on (f.id) f.*, fv.id as form_version_id, fv.version
from form f join form_version fv on f.id = fv."formId" order by f.id, fv.version desc) f on fru."formId" = f.id
inner join role r on fru."roleId" = r.id
inner join role_permission rp on r.id = rp."roleId"
inner join permission p on rp."permissionId" = p.id
group by u.id, u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, f.id, f.name, f.public, f.active, f.form_version_id, f.version
union
select u2.id, u2."keycloakId", u2.username, u2."fullName", u2."firstName", u2."lastName", u2.email, f2.id as "formId", f2.name as "formName", f2.public, f2.active, f2.form_version_id as "formVersionId", f2.version, '{}'::varchar[] as permissions
from (select distinct on (f.id) f.*, fv.id as form_version_id, fv.version
from form f join form_version fv on f.id = fv."formId" order by f.id, fv.version desc) f2, "user" u2
where f2.public = true
and not exists (select * from form_role_user fru2 where fru2."formId"= f2.id and fru2."userId" = u2.id)`))
    .then(() => knex.schema.raw(`create view user_form_roles_vw
            ("id", "keycloakId", username, "fullName", "firstName", "lastName", email, "formId", "formName", public, active, "formVersionId", version, roles)
as
select u.id, u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, f.id as "formId", f.name as "formName", f.public, f.active, f.form_version_id as "formVersionId", f.version, array_agg(r.name) as roles
from form_role_user fru
inner join "user" u on fru."userId" = u.id
inner join (select distinct on (f.id) f.*, fv.id as form_version_id, fv.version
from form f join form_version fv on f.id = fv."formId" order by f.id, fv.version desc) f on fru."formId" = f.id
inner join role r on fru."roleId" = r.id
group by u.id, u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, f.id, f.name, f.public, f.active, f.form_version_id, f.version
union
select u2.id, u2."keycloakId", u2.username, u2."fullName", u2."firstName", u2."lastName", u2.email, f2.id as "formId", f2.name as "formName", f2.public, f2.active, f2.form_version_id as "formVersionId", f2.version, '{}'::varchar[] as roles
from (select distinct on (f.id) f.*, fv.id as form_version_id, fv.version
from form f join form_version fv on f.id = fv."formId" order by f.id, fv.version desc) f2, "user" u2
where f2.public = true
and not exists (select * from form_role_user fru2 where fru2."formId"= f2.id and fru2."userId" = u2.id)`));
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS user_form_roles_vw'))
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS user_form_permissions_vw'));
};
