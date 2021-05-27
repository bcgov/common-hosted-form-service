const previousMigration  = require('./20201019100738_007-public-submission-data-vw').up;

exports.up = function (knex) {
  return Promise.resolve()

    // JOIN user table to submissions_vw on form_submission_status.assignedToUserId to get 'assigned to' user
    .then(() => knex.schema.raw(`create or replace
    view submissions_vw as
    SELECT
      s.id AS "submissionId",
      s."confirmationId",
      s.draft,
      s.deleted,
      s."createdBy",
      s."createdAt",
      f.id AS "formId",
      f.name AS "formName",
      fv.id AS "formVersionId",
      fv."version",
      st.id AS "formSubmissionStatusId",
      st.code AS "formSubmissionStatusCode",
      st."createdBy" AS "formSubmissionStatusCreatedBy",
      st."createdAt" AS "formSubmissionStatusCreatedAt",
      u."fullName" AS "formSubmissionAssignedToFullName",
      u."email" AS "formSubmissionAssignedToEmail"
    FROM
      form_submission s
    JOIN form_version fv ON
      s."formVersionId" = fv.id
    JOIN form f ON
      fv."formId" = f.id
    LEFT OUTER JOIN LATERAL (
      SELECT
        id,
        code,
        "createdBy",
        "createdAt",
        "assignedToUserId"
      FROM
        form_submission_status
      WHERE
        "submissionId" = s.id
      ORDER BY
        "createdAt" DESC
      FETCH FIRST 1 ROW ONLY
    ) st ON true
    LEFT JOIN "user" u ON
      st."assignedToUserId" = u."id"
    ORDER BY
      s."createdAt" DESC`))

    // add extra columns to submissions_data_vw
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

exports.down = function (knex) {
  // to revert this migration and (remove the new columns)
  // we need to  drop..cascade the modified view
  // AND recreate any dependent views
  // currently the only dependent view: 'submissions_data_vw'
  return Promise.resolve()
    // drop the modified 'submissions_vw' view and all dependent views
    .then(() => knex.schema.raw('drop view submissions_vw cascade'))

    // restore 'submissions_vw' from migration 012
    .then(() => knex.schema.raw(`create or replace
    view submissions_vw as
      SELECT s.id AS "submissionId",
      s."confirmationId",
      s.draft,
      s.deleted,
      s."createdBy",
      s."createdAt",
      f.id AS "formId",
      f.name AS "formName",
      fv.id AS "formVersionId",
      fv."version",
      st.id AS "formSubmissionStatusId",
      st.code AS "formSubmissionStatusCode"
    FROM form_submission s
      JOIN form_version fv ON s."formVersionId" = fv.id
      JOIN form f ON fv."formId" = f.id
      LEFT OUTER JOIN LATERAL (
        SELECT id, code, "createdBy", "createdAt"
        FROM form_submission_status
        WHERE "submissionId" = s.id
        ORDER BY "createdAt" DESC
        FETCH FIRST 1 ROW ONLY
      ) st ON true
    ORDER BY s."createdAt" DESC`))

    // recreate dependent view 'submissions_data_vw' from migration 007
    .then(() => previousMigration(knex));
};
