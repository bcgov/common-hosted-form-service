const previousMigration = require('./20210528134214_016-submission-submitters-vw copy').up;

exports.up = function (knex) {
  return Promise.resolve()
    // Add a status update flag
    .then(() => knex.schema.alterTable('form', table => {
      table.boolean('enableSubmitterDraft').notNullable().defaultTo(false).comment('When true, submitters can save drafts');
    }))

    // Update view. Add form join and some fields from form
    .then(() => knex.schema.raw(`create or replace view submissions_submitters_vw as
    SELECT
    fsu.*,
    fv."formId",
    fv."version",
    sub."id",
    sub."confirmationId",
    sub."createdAt",
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
    fv."formId" = f."id"`));
};

exports.down = function (knex) {
  return Promise.resolve()
    // drop the modified 'submissions_vw' view
    .then(() => knex.schema.raw('drop view submissions_submitters_vw'))
    // recreate dependent view 'submissions_data_vw' from migration 16
    .then(() => previousMigration(knex))

    // undo the new field add
    .then(() => knex.schema.alterTable('form', table => {
      table.dropColumn('enableSubmitterDraft');
    }));
};
