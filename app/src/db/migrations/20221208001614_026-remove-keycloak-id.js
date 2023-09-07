exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('user_form_access_vw'))
    .then(() => knex.schema.raw(`create or replace
      view user_form_access_vw as
      select
        r."userId",
        u."idpUserId",
        u.username,
        u."fullName",
        u."firstName",
        u."lastName",
        u.email,
        r."formId",
        f.name as "formName",
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
          f.description as "formDescription"
      from
        "user" u
      join user_form_roles_vw r on
        u.id = r."userId"
      join user_form_permissions_vw p on
        r."userId" = p."userId"
        and r."formId" = p."formId"
      join form_vw f on
        f.id = p."formId"
      order by
        lower(u."lastName"::text),
        lower(u."firstName"::text),
        lower(f.name::text)`))
    .then(() => knex.schema.dropViewIfExists('public_form_access_vw'))
    .then(() => knex.schema.raw(`create view public_form_access_vw as
      select null as "userId", null as "idpUserId", 'public' as username, 'public' as "fullName", null as "firstName", null as "lastName", null as email, f.id as "formId", f.name as "formName", f.labels, f."identityProviders", f.idps, f.active, f."formVersionId", f.version, '{}'::varchar[] as roles, '{submission_create,form_read}'::varchar[] as permissions
      from form_vw f
      where 'public' = ANY(f."idps")
      order by lower(f.name::text)`))

    .then(() => knex.schema.dropViewIfExists('submissions_data_vw'))
    .then(() => knex.schema.raw(`create or replace view submissions_data_vw as
      select
        s."confirmationId",
        s."formName",
        s.version,
        s."createdAt",
        case
          when u.id is null then 'public'::varchar(255)
          else u."fullName"
        end as "fullName",
        case
          when u.id is null then 'public'::varchar(255)
          else u.username
        end as "username",
        u.email,
        fs.submission -> 'data' as "submission",
        s.deleted,
        s.draft,
        s."submissionId",
        s."formId",
        s."formVersionId",
        u.id as "userId",
        u."idpUserId",
        u."firstName",
        u."lastName",
        s."formSubmissionStatusCode" as "status",
        s."formSubmissionAssignedToFullName" as "assignee",
        s."formSubmissionAssignedToEmail" as "assigneeEmail"
      from
        submissions_vw s
      inner join form_submission fs on
        s."submissionId" = fs.id
      left outer join form_submission_user fsu on
        s."submissionId" = fsu."formSubmissionId"
        and fsu.permission = 'submission_create'
      left outer join "user" u on
        fsu."userId" = u.id
      order by
        s."createdAt",
        s."formName",
        s.version`));
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('user_form_access_vw'))
    .then(() => knex.schema.raw(`create or replace
    view user_form_access_vw as
    select
      r."userId",
      u."keycloakId",
      u.username,
      u."fullName",
      u."firstName",
      u."lastName",
      u.email,
      r."formId",
      f.name as "formName",
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
        f.description as "formDescription"
    from
      "user" u
    join user_form_roles_vw r on
      u.id = r."userId"
    join user_form_permissions_vw p on
      r."userId" = p."userId"
      and r."formId" = p."formId"
    join form_vw f on
      f.id = p."formId"
    order by
      lower(u."lastName"::text),
      lower(u."firstName"::text),
      lower(f.name::text)`))

    .then(() => knex.schema.dropViewIfExists('public_form_access_vw'))
    .then(() => knex.schema.raw(`create view public_form_access_vw as
      select null as "userId", null as "keycloakId", 'public' as username, 'public' as "fullName", null as "firstName", null as "lastName", null as email, f.id as "formId", f.name as "formName", f.labels, f."identityProviders", f.idps, f.active, f."formVersionId", f.version, '{}'::varchar[] as roles, '{submission_create,form_read}'::varchar[] as permissions
      from form_vw f
      where 'public' = ANY(f."idps")
      order by lower(f.name::text)`))

    .then(() => knex.schema.dropViewIfExists('submissions_data_vw'))
    .then(() => knex.schema.raw(`create or replace view submissions_data_vw as
      select
        s."confirmationId",
        s."formName",
        s.version,
        s."createdAt",
        case
          when u.id is null then 'public'::varchar(255)
          else u."fullName"
        end as "fullName",
        case
          when u.id is null then 'public'::varchar(255)
          else u.username
        end as "username",
        u.email,
        fs.submission -> 'data' as "submission",
        s.deleted,
        s.draft,
        s."submissionId",
        s."formId",
        s."formVersionId",
        u.id as "userId",
        u."keycloakId",
        u."firstName",
        u."lastName",
        s."formSubmissionStatusCode" as "status",
        s."formSubmissionAssignedToFullName" as "assignee",
        s."formSubmissionAssignedToEmail" as "assigneeEmail"
      from
        submissions_vw s
      inner join form_submission fs on
        s."submissionId" = fs.id
      left outer join form_submission_user fsu on
        s."submissionId" = fsu."formSubmissionId"
        and fsu.permission = 'submission_create'
      left outer join "user" u on
        fsu."userId" = u.id
      order by
        s."createdAt",
        s."formName",
        s.version`));
};
