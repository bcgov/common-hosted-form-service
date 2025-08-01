/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.alterTable('form', (table) => {
        table.boolean('enableSubmitterRevision').notNullable().defaultTo(false).comment('When true, submitters can revise their submissions');
      })
    )
    .then(() => knex.schema.raw('drop view submissions_submitters_vw'))
    .then(() =>
      knex.schema.raw(`create or replace view submissions_submitters_vw as
    SELECT
      fsu.*,
      fv."formId",
      fv."version",
      sub."id",
      sub."confirmationId",
      sub."createdAt",
      sub."updatedAt",
      sub."draft",
      sub."deleted",
      f.name,
      f.description,
      f.active,
      f."enableStatusUpdates",
      f."enableSubmitterDraft",
      f."enableSubmitterRevision"
    FROM
      form_submission_users_vw fsu
    INNER JOIN form_submission sub ON
      sub."id" = fsu."formSubmissionId"
    INNER JOIN form_version fv ON
      fv."id" = sub."formVersionId"
    INNER JOIN form f ON
      fv."formId" = f."id"`)
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('drop view submissions_submitters_vw'))
    .then(() =>
      knex.schema.raw(`create or replace view submissions_submitters_vw as
    SELECT
      fsu.*,
      fv."formId",
      fv."version",
      sub."id",
      sub."confirmationId",
      sub."createdAt",
      sub."updatedAt",
      sub."draft",
      sub."deleted",
      f.name,
      f.description,
      f.active,
      f."enableStatusUpdates",
      f."enableSubmitterDraft"
    FROM
      form_submission_users_vw fsu
    INNER JOIN form_submission sub ON
      sub."id" = fsu."formSubmissionId"
    INNER JOIN form_version fv ON
      fv."id" = sub."formVersionId"
    INNER JOIN form f ON
      fv."formId" = f."id"`)
    )
    .then(() =>
      knex.schema.alterTable('form', (table) => {
        table.dropColumn('enableSubmitterRevision');
      })
    );
};
