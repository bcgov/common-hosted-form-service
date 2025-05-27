/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const trx = await knex.transaction();

  try {
    // First: Add the new column to the form table
    await trx.schema.alterTable('form', function (table) {
      table.boolean('allowSubmittersToSeeAssignee').defaultTo(false);
    });

    // Second: Update the database views to include username@idp format

    //Drop submissions_data_vw
    await trx.schema.dropViewIfExists('submissions_data_vw');

    //Drop submissions_vw
    await trx.schema.dropViewIfExists('submissions_vw');

    //Recreate submissions_vw WITH the new usernameIdp column
    await trx.schema.raw(`
      CREATE VIEW submissions_vw AS
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
          CASE WHEN u."idpCode" IS NOT NULL AND u."idpCode" != '' 
               THEN u.username || '@' || u."idpCode" 
               ELSE u.username 
          END AS "formSubmissionAssignedToUsernameIdp",
          st."assignedToUserId" AS "formSubmissionAssignedToUserId",
          s.submission
      FROM form_submission s
          JOIN form_version fv ON s."formVersionId" = fv.id
          JOIN form f ON fv."formId" = f.id
          LEFT JOIN LATERAL ( 
              SELECT form_submission_status.id,
                  form_submission_status.code,
                  form_submission_status."createdBy",
                  form_submission_status."createdAt",
                  form_submission_status."assignedToUserId"
              FROM form_submission_status
              WHERE form_submission_status."submissionId" = s.id
              ORDER BY form_submission_status."createdAt" DESC
              LIMIT 1
          ) st ON true
          LEFT JOIN "user" u ON st."assignedToUserId" = u.id
      ORDER BY s."createdAt" DESC
    `);

    //Recreate submissions_data_vw with the new column reference
    await trx.schema.raw(`
      CREATE VIEW submissions_data_vw AS
      SELECT 
          s."confirmationId",
          s."formName",
          s.version,
          s."createdAt",
          CASE 
              WHEN u.id IS NULL THEN 'public' 
              ELSE u."fullName" 
          END AS "fullName",
          CASE 
              WHEN u.id IS NULL THEN 'public' 
              ELSE u.username 
          END AS username,
          u.email,
          fs.submission -> 'data' AS submission,
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
          s."formSubmissionAssignedToUsernameIdp" AS "assigneeUsernameIdp",
          s."formSubmissionAssignedToEmail" AS "assigneeEmail",
          s."formSubmissionAssignedToUserId" AS "assigneeUserId",
          fss."createdAt" AS "submittedAt"
      FROM submissions_vw s
          JOIN form_submission fs ON s."submissionId" = fs.id
          LEFT JOIN form_submission_user fsu 
              ON s."submissionId" = fsu."formSubmissionId"
              AND fsu.permission = 'submission_create'
          LEFT JOIN "user" u ON fsu."userId" = u.id
          JOIN (
              SELECT 
                  "submissionId",
                  "createdAt",
                  ROW_NUMBER() OVER (
                      PARTITION BY "submissionId" 
                      ORDER BY "createdAt" DESC
                  ) AS rn
              FROM form_submission_status
              WHERE code = 'SUBMITTED'
          ) fss ON s."submissionId" = fss."submissionId"
      WHERE fss.rn = 1
      ORDER BY s."createdAt", s."formName", s.version
    `);

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const trx = await knex.transaction();

  try {
    // First: Drop views in reverse order
    await trx.schema.dropViewIfExists('submissions_data_vw');
    await trx.schema.dropViewIfExists('submissions_vw');

    // Recreate submissions_vw without usernameIdp column (back to previous migration state)
    await trx.schema.raw(`
      CREATE VIEW submissions_vw AS
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
          st."assignedToUserId" AS "formSubmissionAssignedToUserId",
          s.submission
      FROM form_submission s
          JOIN form_version fv ON s."formVersionId" = fv.id
          JOIN form f ON fv."formId" = f.id
          LEFT JOIN LATERAL ( 
              SELECT form_submission_status.id,
                  form_submission_status.code,
                  form_submission_status."createdBy",
                  form_submission_status."createdAt",
                  form_submission_status."assignedToUserId"
              FROM form_submission_status
              WHERE form_submission_status."submissionId" = s.id
              ORDER BY form_submission_status."createdAt" DESC
              LIMIT 1
          ) st ON true
          LEFT JOIN "user" u ON st."assignedToUserId" = u.id
      ORDER BY s."createdAt" DESC
    `);

    // Recreate submissions_data_vw without usernameIdp column
    await trx.schema.raw(`
      CREATE VIEW submissions_data_vw AS
      SELECT 
          s."confirmationId",
          s."formName",
          s.version,
          s."createdAt",
          CASE 
              WHEN u.id IS NULL THEN 'public' 
              ELSE u."fullName" 
          END AS "fullName",
          CASE 
              WHEN u.id IS NULL THEN 'public' 
              ELSE u.username 
          END AS username,
          u.email,
          fs.submission -> 'data' AS submission,
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
          s."formSubmissionAssignedToUserId" AS "assigneeUserId",
          fss."createdAt" AS "submittedAt"
      FROM submissions_vw s
          JOIN form_submission fs ON s."submissionId" = fs.id
          LEFT JOIN form_submission_user fsu 
              ON s."submissionId" = fsu."formSubmissionId"
              AND fsu.permission = 'submission_create'
          LEFT JOIN "user" u ON fsu."userId" = u.id
          JOIN (
              SELECT 
                  "submissionId",
                  "createdAt",
                  ROW_NUMBER() OVER (
                      PARTITION BY "submissionId" 
                      ORDER BY "createdAt" DESC
                  ) AS rn
              FROM form_submission_status
              WHERE code = 'SUBMITTED'
          ) fss ON s."submissionId" = fss."submissionId"
      WHERE fss.rn = 1
      ORDER BY s."createdAt", s."formName", s.version
    `);

    // Last: Remove the column from the form table
    await trx.schema.alterTable('form', function (table) {
      table.dropColumn('allowSubmittersToSeeAssignee');
    });

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};
