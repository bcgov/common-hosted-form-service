
exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw(`create view user_form_permissions_vw as 
select u.id, u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, f.id as "formId", f.name as "formName", f."shortName", f.labels, f.idps, f.active, f."formVersionId", f.version, array_agg(p.name) as permissions
from form_role_user fru
inner join "user" u on fru."userId" = u.id
inner join form_vw f on fru."formId" = f.id
inner join role r on fru."roleId" = r.id
inner join role_permission rp on r.id = rp."roleId"
inner join permission p on rp."permissionId" = p.id
group by u.id, u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, f.id, f.name, f."shortName", f.labels, f.idps, f.active, f."formVersionId", f.version
union
select u2.id, u2."keycloakId", u2.username, u2."fullName", u2."firstName", u2."lastName", u2.email, f2.id as "formId", f2.name as "formName", f2."shortName", f2.labels, f2.idps, f2.active, f2."formVersionId", f2.version, '{}'::varchar[] as permissions
from form_vw f2, "user" u2
where 'public' = ANY(f2."idps")
and not exists (select * from form_role_user fru2 where fru2."formId"= f2.id and fru2."userId" = u2.id)`))
    .then(() => knex.schema.raw(`create view user_form_roles_vw as 
select u.id, u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, f.id as "formId", f.name as "formName", f."shortName", f.labels, f.idps, f.active, f."formVersionId", f.version, array_agg(r.name) as roles
from form_role_user fru
inner join "user" u on fru."userId" = u.id
inner join form_vw f on fru."formId" = f.id
inner join role r on fru."roleId" = r.id
group by u.id, u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, f.id, f.name, f."shortName", f.labels, f.idps, f.active, f."formVersionId", f.version
union
select u2.id, u2."keycloakId", u2.username, u2."fullName", u2."firstName", u2."lastName", u2.email, f2.id as "formId", f2.name as "formName", f2."shortName", f2.labels, f2.idps, f2.active, f2."formVersionId", f2.version, '{}'::varchar[] as roles
from form_vw f2, "user" u2
where 'public' = ANY(f2."idps")
and not exists (select * from form_role_user fru2 where fru2."formId"= f2.id and fru2."userId" = u2.id)`))
    .then(() => knex.schema.raw(`create view user_form_access_vw as 
select r.id, r."keycloakId", r.username, r."fullName", r."firstName", r."lastName", r.email, r."formId", r."formName", r."shortName", r.labels, r.idps, r.active, r."formVersionId", r.version, r.roles, p.permissions
from user_form_roles_vw r join user_form_permissions_vw p on r.id = p.id and r."formId" = p."formId"
order by lower(r."lastName"), lower(r."firstName"), lower(r."formName")`));
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS user_form_access_vw'))
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS user_form_roles_vw'))
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS user_form_permissions_vw'));
};
