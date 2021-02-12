
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw(`create or replace view submissions_data_vw as
select s."confirmationId", s."formName", s.version, s."createdAt",
       case when u.id is null then 'public'::varchar(255) else u."fullName" end as "fullName", case when u.id is null then 'public'::varchar(255) else u.username end as "username", u.email,
       fs.submission -> 'data' AS "submission", s.deleted, s.draft,
       s."submissionId", s."formId", s."formVersionId", u.id as "userId", u."keycloakId", u."firstName", u."lastName"
from submissions_vw s
    inner join form_submission fs on s."submissionId" = fs.id
    left outer join form_submission_user fsu on s."submissionId" = fsu."formSubmissionId" and fsu.permission = 'submission_create'
    left outer join "user" u on fsu."userId" = u.id
order by s."createdAt", s."formName", s.version`));
};

exports.down = function (knex) {
  // Restore original definition of this view from 005
  return Promise.resolve()
    .then(() => knex.schema.raw(`create or replace view submissions_data_vw as
select s."confirmationId", s."formName", s.version, s."createdAt",
       u."fullName", u.username, u.email,
       fs.submission -> 'data' AS "submission", s.deleted, s.draft,
       s."submissionId", s."formId", s."formVersionId", u.id as "userId", u."keycloakId", u."firstName", u."lastName"
from submissions_vw s
    inner join form_submission fs on s."submissionId" = fs.id
    inner join form_submission_user fsu on s."submissionId" = fsu."formSubmissionId" and fsu.permission = 'submission_create'
    inner join "user" u on fsu."userId" = u.id
order by s."createdAt", s."formName", s.version`));
};
