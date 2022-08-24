const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('form_version_draft', table => {
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.uuid('formVersionId').references('id').inTable('form_version').nullable();
      table.jsonb('schema');
      stamps(knex, table);
    }))
    .then(() => knex.schema.alterTable('form_version', table => {
      table.boolean('published').notNullable().defaultTo(false);
    }))
    .then(() => knex.schema.raw(`create or replace view form_vw as
      SELECT DISTINCT ON (lower(f.name::text), fv.version, f.id) f.id,
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
                                              case when count(ip.idp) = 0 then '{}'::varchar[] else array_agg(distinct(ip.idp)) end AS idps,
                                              fv.published,
                                              fv."updatedAt" as "versionUpdatedAt"
    FROM form f
            LEFT JOIN LATERAL (select v.* from form_version v where v."formId" = f.id order by case when v.published then 1 else 0 end desc, v.version desc limit 1) fv ON true
            LEFT OUTER JOIN form_identity_provider fip ON f.id = fip."formId"
            LEFT OUTER JOIN identity_provider ip ON fip.code::text = ip.code::text
    GROUP BY f.id, f.name, f.active, f.description, f.labels, f."createdAt", f."createdBy", f."updatedAt",
            f."updatedBy", fv.id, fv.version, fv.published, fv."updatedAt"
    ORDER BY lower(f.name::text), fv.version DESC, f.id`))
    .then(() => knex.schema.raw(`create or replace view user_form_access_vw as
select r."userId", u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, r."formId", f.name as "formName", f.labels, f."identityProviders", f.idps, f.active, f."formVersionId", f.version, r.roles, p.permissions, f.published, f."versionUpdatedAt"
from "user" u join user_form_roles_vw r on u.id = r."userId" join user_form_permissions_vw p on r."userId" = p."userId" and r."formId" = p."formId" join form_vw f on f.id = p."formId"
order by lower(u."lastName"::text), lower(u."firstName"::text), lower(f.name::text)`));
};

exports.down = function(knex) {
  // OK, this is really ugly.
  // One cannot simply remove a column from a view.
  // One must drop the view and then recreate; however, one must drop ALL the dependant objects too, then recreate them.
  // Very lame.
  // first, drop the view that uses the new column (and all objects that use that view)
  // then we drop the column from the table
  // then we re-create the view and all the views that depend on it.
  //
  // then we are dropping the table added in this migration.
  return Promise.resolve()
    .then(() => knex.schema.raw('drop view form_vw cascade'))
    .then(() => knex.schema.alterTable('form_version', table => {
      table.dropColumn('published');
    }))
    .then(() => knex.schema.raw(`create or replace view form_vw as
      SELECT DISTINCT ON (lower(f.name::text), fv.version, f.id) f.id,
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
    ORDER BY lower(f.name::text), fv.version DESC, f.id`))
    .then(() => knex.schema.raw(`create or replace view user_form_permissions_vw as
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
    .then(() => knex.schema.raw(`create or replace view user_form_roles_vw as
select fru."userId", fru."formId", array_agg(distinct(r.code)) as roles
from form_role_user fru
inner join role r on fru.role = r.code
group by fru."userId", fru."formId"
union
select u2.id as "userId", f2.id as "formId", '{}'::varchar[] as roles
from form_vw f2, "user" u2
where not exists (select * from form_role_user fru2 where fru2."formId"= f2.id and fru2."userId" = u2.id)`))
    .then(() => knex.schema.raw(`create or replace view user_form_access_vw as
select r."userId", u."keycloakId", u.username, u."fullName", u."firstName", u."lastName", u.email, r."formId", f.name as "formName", f.labels, f."identityProviders", f.idps, f.active, f."formVersionId", f.version, r.roles, p.permissions
from "user" u join user_form_roles_vw r on u.id = r."userId" join user_form_permissions_vw p on r."userId" = p."userId" and r."formId" = p."formId" join form_vw f on f.id = p."formId"
order by lower(u."lastName"::text), lower(u."firstName"::text), lower(f.name::text)`))
    .then(() => knex.schema.raw(`create view public_form_access_vw as
select null as "userId", null as "keycloakId", 'public' as username, 'public' as "fullName", null as "firstName", null as "lastName", null as email, f.id as "formId", f.name as "formName", f.labels, f."identityProviders", f.idps, f.active, f."formVersionId", f.version, '{}'::varchar[] as roles, '{submission_create,form_read}'::varchar[] as permissions
from form_vw f
where 'public' = ANY(f."idps")
order by lower(f.name::text)`))
    .then(() => knex.schema.dropTableIfExists('form_version_draft'));
};
