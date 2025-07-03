exports.up = function (knex) {
  return (
    Promise.resolve()
      .then(() => knex.schema.raw(`DROP TRIGGER IF EXISTS form_submission_audit_trigger ON form_submission`))

      // Recreate trigger using EXECUTE FUNCTION
      .then(() =>
        knex.schema.raw(`
        CREATE TRIGGER form_submission_audit_trigger
        AFTER UPDATE OR DELETE ON form_submission
        FOR EACH ROW EXECUTE FUNCTION public.submission_audited_func();
        `)
      )
      .then(() =>
        knex.schema.raw(`
          UPDATE pg_proc
          SET prosrc = REPLACE(prosrc, 'jsonb_each', 'jsonb_path_query_array')
          WHERE prosrc LIKE '%jsonb_each%';
      `)
      )
      .then(() =>
        knex.schema.raw(`
          UPDATE pg_proc
          SET prosrc = REPLACE(prosrc, 'jsonb_object', 'jsonb_build_object')
          WHERE prosrc LIKE '%jsonb_object%';
      `)
      )
      .then(() =>
        knex.schema.raw(`
          UPDATE pg_proc
          SET prosrc = REPLACE(prosrc, 'jsonb_pretty', 'jsonb_format')
          WHERE prosrc LIKE '%jsonb_pretty%';
      `)
      )
      .then(() =>
        knex.schema.raw(`
          UPDATE pg_proc
          SET prosrc = REPLACE(prosrc, 'jsonb_strip_nulls', 'jsonb_path_query')
          WHERE prosrc LIKE '%jsonb_strip_nulls%';
      `)
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
          jsonb_extract_path(fs.submission, 'data') AS submission,
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
        ORDER BY s."createdAt", s."formName", s.version;
          `)
      )
  );
};

exports.down = function (knex) {
  return (
    Promise.resolve()
      .then(() => knex.schema.raw(`DROP TRIGGER IF EXISTS form_submission_audit_trigger ON form_submission`))

      // Restore the trigger with EXECUTE PROCEDURE (for older PostgreSQL versions)
      .then(() =>
        knex.schema.raw(`
        CREATE TRIGGER form_submission_audit_trigger
        AFTER UPDATE OR DELETE ON form_submission
        FOR EACH ROW EXECUTE PROCEDURE public.submission_audited_func();
        `)
      )
      .then(() =>
        knex.schema.raw(`
        UPDATE pg_proc
        SET prosrc = REPLACE(prosrc, 'jsonb_path_query_array', 'jsonb_each')
        WHERE prosrc LIKE '%jsonb_path_query_array%';
        `)
      )
      .then(() =>
        knex.schema.raw(`
          UPDATE pg_proc
          SET prosrc = REPLACE(prosrc, 'jsonb_build_object', 'jsonb_object')
          WHERE prosrc LIKE '%jsonb_build_object%';
        `)
      )
      .then(() =>
        knex.schema.raw(`
          UPDATE pg_proc
          SET prosrc = REPLACE(prosrc, 'jsonb_format', 'jsonb_pretty')
          WHERE prosrc LIKE '%jsonb_format%';
        `)
      )
      .then(() =>
        knex.schema.raw(`
          UPDATE pg_proc
          SET prosrc = REPLACE(prosrc, 'jsonb_path_query', 'jsonb_strip_nulls')
          WHERE prosrc LIKE '%jsonb_path_query%';
        `)
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
      )
  );
};
