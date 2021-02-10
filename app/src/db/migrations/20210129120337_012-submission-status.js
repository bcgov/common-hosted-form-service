const stamps = require('../stamps');
const { v4: uuidv4 } = require('uuid');

const CREATED_BY = 'migration-012';

const statusCodes = [
  { code: 'SUBMITTED', display: 'Submitted', enabled: true, nextCodes: ['ASSIGNED', 'COMPLETED'], createdBy: CREATED_BY },
  { code: 'ASSIGNED', display: 'Assigned', enabled: true, nextCodes: ['ASSIGNED', 'COMPLETED'], createdBy: CREATED_BY },
  { code: 'COMPLETED', display: 'Completed', enabled: true, nextCodes: ['ASSIGNED'], createdBy: CREATED_BY }
];

exports.up = function (knex) {
  return Promise.resolve()
    // Add a status update flag
    .then(() => knex.schema.alterTable('form', table => {
      table.boolean('enableStatusUpdates').notNullable().defaultTo(false).comment('When true, submissions of this form will have status updates available');
    }))

    // add a status_code table
    .then(() => knex.schema.createTable('status_code', table => {
      table.string('code').primary();
      table.string('display').notNullable();
      table.specificType('nextCodes', 'text ARRAY').comment('This is an array of codes that this status could transition to next');
      stamps(knex, table);
    }))
    // seed the table
    .then(() => {
      return knex('status_code').insert(statusCodes);
    })

    // add a form_status_code table
    // this links each form to the statuses available to it, could be used to customize in the future
    .then(() => knex.schema.createTable('form_status_code', table => {
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.string('code').references('code').inTable('status_code').notNullable().index();
      stamps(knex, table);
    }))
    // Get all form ids
    .then(() => {
      return knex('form').select('id');
    })
    // Insert the form->status code mapping for each form
    .then(forms => {
      const formStatuses = forms.flatMap(f => statusCodes.flatMap(sc => ({
        id: uuidv4(),
        formId: f.id,
        code: sc.code,
        createdBy: CREATED_BY
      })));
      return knex('form_status_code').insert(formStatuses);
    })

    // add a form_submission_status table
    // links a submission to a status
    .then(() => knex.schema.createTable('form_submission_status', table => {
      table.uuid('id').primary();
      table.uuid('submissionId').references('id').inTable('form_submission').notNullable().index();
      table.string('code').references('code').inTable('status_code').notNullable().index();
      table.string('assignedTo');
      table.string('assignedToEmail');
      table.date('actionDate').nullable();
      stamps(knex, table);
    }))
    // Get all submission ids
    .then(() => {
      return knex('form_submission').select('id', 'createdBy', 'createdAt');
    })
    // Backfill submission statuses to "SUBMITTED for each exsiting submission"
    // Use the original submitter and time as the creator (store "migrate" in updatedBy for tracking)
    .then(submissions => {
      const subStatuses = submissions.map(s => ({
        id: uuidv4(),
        submissionId: s.id,
        code: 'SUBMITTED',
        createdBy: s.createdBy,
        createdAt: s.createdAt,
        updatedBy: CREATED_BY
      }));
      return knex('form_submission_status').insert(subStatuses);
    })

    // add a note table
    .then(() => knex.schema.createTable('note', table => {
      table.uuid('id').primary();
      table.uuid('submissionId').references('id').inTable('form_submission').index();
      table.uuid('submissionStatusId').references('id').inTable('form_submission_status').index();
      table.string('note', 4000).nullable();
      stamps(knex, table);
    }))

    // modify the submission view to return status information
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
    ORDER BY s."createdAt" DESC`));

};

exports.down = function (knex) {
  return Promise.resolve()
    // reset the submission view to return status information
    .then(() => knex.schema.raw('drop view submissions_vw cascade'))
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
        fv.version
      FROM form_submission s
      JOIN form_version fv ON s."formVersionId" = fv.id
      JOIN form f ON fv."formId" = f.id
      ORDER BY s."createdAt" DESC;`))

    // undo the new tables
    .then(() => knex.schema.dropTableIfExists('note'))
    .then(() => knex.schema.dropTableIfExists('form_submission_status'))
    .then(() => knex.schema.dropTableIfExists('form_status_code'))
    .then(() => knex.schema.dropTableIfExists('status_code'))

    // undo the new field add
    .then(() => knex.schema.alterTable('form', table => {
      table.dropColumn('enableStatusUpdates');
    }));
};
