/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const trx = await knex.transaction();

  try {
    //Drop submissions_data_vw
    await trx.schema.dropViewIfExists('submissions_data_vw');

    //Recreate submissions_data_vw with the assignee column added
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
// eslint-disable-next-line no-unused-vars
exports.down = async function (knex) {
  return; // we do not want to rollback as we added a column that should not be removed
};
