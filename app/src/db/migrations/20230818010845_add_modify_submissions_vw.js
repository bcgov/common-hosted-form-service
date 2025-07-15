// NOTE: before change submissions_vw view we need to delete submissions_data_vw since it's depended on submissions_vw
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('submissions_data_vw'))
    .then(() => knex.schema.dropViewIfExists('submissions_vw'))
    .then(() =>
      knex.schema.raw(`CREATE OR REPLACE VIEW submissions_vw AS
          SELECT s.id AS "submissionId",
              s."confirmationId",
              s.draft,
              s.deleted,
              s."createdBy",
              s."createdAt",
              s."updatedAt",
              s."updatedBy",
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
            ORDER BY s."createdAt" DESC`)
    )
    .then(() =>
      knex.schema.raw(`CREATE OR REPLACE VIEW public.submissions_data_vw
    AS SELECT s."confirmationId",
        s."formName",
        s.version,
        s."createdAt",
            CASE
                WHEN u.id IS NULL THEN 'public'::character varying(255)
                ELSE u."fullName"
            END AS "fullName",
            CASE
                WHEN u.id IS NULL THEN 'public'::character varying(255)
                ELSE u.username
            END AS username,
        u.email,
        fs.submission -> 'data'::text AS submission,
        fs."updatedAt",
        fs."updatedBy",
        s.deleted,
        s.draft,
        s."submissionId",
        s."formId",
        s."formVersionId",
        u.id AS "userId",
        u."idpUserId",
        u."firstName",
        u."lastName",
        s."formSubmissionStatusCode" AS status,
        s."formSubmissionAssignedToFullName" AS assignee,
        s."formSubmissionAssignedToEmail" AS "assigneeEmail"
       FROM submissions_vw s
         JOIN form_submission fs ON s."submissionId" = fs.id
         LEFT JOIN form_submission_user fsu ON s."submissionId" = fsu."formSubmissionId" AND fsu.permission::text = 'submission_create'::text
         LEFT JOIN "user" u ON fsu."userId" = u.id
      ORDER BY s."createdAt", s."formName", s.version;`)
    );
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('submissions_data_vw'))
    .then(() => knex.schema.dropViewIfExists('submissions_vw'))
    .then(() =>
      knex.schema
        .raw(
          `CREATE OR REPLACE VIEW submissions_vw AS
          SELECT s.id AS "submissionId",
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
            ORDER BY s."createdAt" DESC`
        )
        .then(() =>
          knex.schema.raw(`CREATE OR REPLACE VIEW public.submissions_data_vw
          AS SELECT s."confirmationId",
              s."formName",
              s.version,
              s."createdAt",
                  CASE
                      WHEN u.id IS NULL THEN 'public'::character varying(255)
                      ELSE u."fullName"
                  END AS "fullName",
                  CASE
                      WHEN u.id IS NULL THEN 'public'::character varying(255)
                      ELSE u.username
                  END AS username,
              u.email,
              fs.submission -> 'data'::text AS submission,
              fs."updatedAt",
              s.deleted,
              s.draft,
              s."submissionId",
              s."formId",
              s."formVersionId",
              u.id AS "userId",
              u."idpUserId",
              u."firstName",
              u."lastName",
              s."formSubmissionStatusCode" AS status,
              s."formSubmissionAssignedToFullName" AS assignee,
              s."formSubmissionAssignedToEmail" AS "assigneeEmail"
             FROM submissions_vw s
               JOIN form_submission fs ON s."submissionId" = fs.id
               LEFT JOIN form_submission_user fsu ON s."submissionId" = fsu."formSubmissionId" AND fsu.permission::text = 'submission_create'::text
               LEFT JOIN "user" u ON fsu."userId" = u.id
            ORDER BY s."createdAt", s."formName", s.version;`)
        )
    );
};
