exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw(`create or replace view submissions_submitters_vw as
    SELECT
    fsu.*,
    fv."formId",
    fv."version",
    sub."id",
    sub."confirmationId",
    sub."createdAt",
    sub."draft",
    sub."deleted"
  FROM
    form_submission_users_vw fsu
  INNER JOIN form_submission sub ON
    sub."id" = fsu."formSubmissionId"
  INNER JOIN form_version fv ON
    fv."id" = sub."formVersionId"`));
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS submissions_submitters_vw'));
};
