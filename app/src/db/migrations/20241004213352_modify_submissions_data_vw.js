exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('submissions_data_vw'))
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
    s."formSubmissionAssignedToEmail" AS "assigneeEmail",
    fss."createdAt" AS "submittedAt"
   FROM submissions_vw s
     JOIN form_submission fs ON s."submissionId" = fs.id
     LEFT JOIN form_submission_user fsu ON s."submissionId" = fsu."formSubmissionId" AND fsu.permission::text = 'submission_create'::text
     LEFT JOIN "user" u ON fsu."userId" = u.id
     JOIN (
    SELECT form_submission_status."submissionId", form_submission_status."createdAt", ROW_NUMBER() OVER (PARTITION BY form_submission_status."submissionId" ORDER BY form_submission_status."createdAt" DESC) AS rn
    FROM form_submission_status where form_submission_status.code='SUBMITTED'
) fss
ON s."submissionId" = fss."submissionId" WHERE fss.rn = 1
  ORDER BY s."createdAt", s."formName", s.version;`)
    );
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('submissions_data_vw'))
    .then(() =>
      knex.schema.raw(
        `CREATE OR REPLACE VIEW public.submissions_data_vw
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
        ORDER BY s."createdAt", s."formName", s.version;`
      )
    );
};
