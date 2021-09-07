const previousMigration = require('./20210519170000_015-alter-submission-data-vw').up;

exports.up = function (knex) {
  return Promise.resolve()
    // add data column to submissions_vw
    .then(() => knex.schema.raw(`CREATE OR REPLACE VIEW public.submissions_vw
    AS SELECT s.id AS "submissionId",
        s."confirmationId",
        s.draft,
        s.deleted,
        s."createdBy",
        s."createdAt",
        f.id AS "formId",
        f.name AS "formName",
        fv.id AS "formVersionId",
        fv.version,
        st.id AS "formSubmissionStatusId",
        st.code AS "formSubmissionStatusCode",
        st."createdBy" AS "formSubmissionStatusCreatedBy",
        st."createdAt" AS "formSubmissionStatusCreatedAt",
        u."fullName" AS "formSubmissionAssignedToFullName",
        u.email AS "formSubmissionAssignedToEmail",
        s.submission
       FROM form_submission s
         JOIN form_version fv ON s."formVersionId" = fv.id
         JOIN form f ON fv."formId" = f.id
         LEFT JOIN LATERAL ( SELECT form_submission_status.id,
                form_submission_status.code,
                form_submission_status."createdBy",
                form_submission_status."createdAt",
                form_submission_status."assignedToUserId"
               FROM form_submission_status
              WHERE form_submission_status."submissionId" = s.id
              ORDER BY form_submission_status."createdAt" DESC
             LIMIT 1) st ON true
         LEFT JOIN "user" u ON st."assignedToUserId" = u.id
      ORDER BY s."createdAt" DESC;`));
};

exports.down = function (knex) {
  return Promise.resolve()
    // drop the modified 'submissions_vw' view and all dependent views
    .then(() => knex.schema.raw('drop view submissions_vw cascade'))

    // recreate 'submissions_vw' from migration 015
    // recreate dependent view 'submissions_data_vw' from migration 015
    .then(() => previousMigration(knex));
};
