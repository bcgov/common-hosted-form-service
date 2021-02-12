
exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw(`create view form_vw as
SELECT DISTINCT ON ((lower(f.name::text))) f.id,
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
                                           case when count(fip.code) = 0 then '{}'::varchar[] else array_agg(distinct(fip.code)) end AS "identityProviders",
                                           case when count(ip.idp) = 0 then '{}'::varchar[] else array_agg(distinct(ip.idp)) end AS idps
FROM form f
         JOIN form_version fv ON f.id = fv."formId"
         LEFT OUTER JOIN form_identity_provider fip ON f.id = fip."formId"
         LEFT OUTER JOIN identity_provider ip ON fip.code::text = ip.code::text
GROUP BY f.id, f.name, f.active, f.description, f.labels, f."createdAt", f."createdBy", f."updatedAt",
         f."updatedBy", fv.id, fv.version
ORDER BY (lower(f.name::text)), fv.version DESC`))
    .then(() => knex.schema.raw(`create view user_form_permissions_vw as
select fru."userId", fru."formId", array_agg(distinct(p.code)) as permissions
from form_role_user fru
inner join role r on fru.role = r.code
inner join role_permission rp on r.code = rp.role
inner join permission p on rp.permission = p.code
group by fru."userId", fru."formId"
union
select u2.id as "userId", f2.id as "formId", '{submission_create,form_read}'::varchar[] as permissions
from form_vw f2, "user" u2
where not exists (select * from form_role_user fru2 where fru2."formId"= f2.id and fru2."userId" = u2.id)`))
    .then(() => knex.schema.raw(`create view user_form_roles_vw as
select fru."userId", fru."formId", array_agg(distinct(r.code)) as roles
from form_role_user fru
inner join role r on fru.role = r.code
group by fru."userId", fru."formId"
union
select u2.id as "userId", f2.id as "formId", '{}'::varchar[] as roles
from form_vw f2, "user" u2
where not exists (select * from form_role_user fru2 where fru2."formId"= f2.id and fru2."userId" = u2.id)`))
    .then(() => knex.schema.raw(`create view user_form_access_vw as
select r."userId", u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, r."formId", f.name as "formName", f.labels, f."identityProviders", f.idps, f.active, f."formVersionId", f.version, r.roles, p.permissions
from "user" u join user_form_roles_vw r on u.id = r."userId" join user_form_permissions_vw p on r."userId" = p."userId" and r."formId" = p."formId" join form_vw f on f.id = p."formId"
order by lower(u."lastName"::text), lower(u."firstName"::text), lower(f.name::text)`))
    .then(() => knex.schema.raw(`create view public_form_access_vw as
select null as "userId", null as "keycloakId", 'public' as username, 'public' as "fullName", null as "firstName", null as "lastName", null as email, f.id as "formId", f.name as "formName", f.labels, f."identityProviders", f.idps, f.active, f."formVersionId", f.version, '{}'::varchar[] as roles, '{submission_create,form_read}'::varchar[] as permissions
from form_vw f
where 'public' = ANY(f."idps")
order by lower(f.name::text)`))
    .then(() => knex.schema.raw(`create view submissions_vw as
select s.id as "submissionId", s."confirmationId", s.draft, s.deleted, s."createdBy", s."createdAt", f.id as "formId", f.name as "formName", fv.id as"formVersionId", fv.version
from form_submission as s
    inner join form_version fv on s."formVersionId" = fv.id
    inner join form f on fv."formId" = f.id
order by s."createdAt" desc`));
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS submissions_vw'))
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS public_form_access_vw'))
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS user_form_access_vw'))
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS user_form_roles_vw'))
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS user_form_permissions_vw'))
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS form_vw'));
};
