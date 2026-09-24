const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('submission_package_job', (table) => {
      table.uuid('id').primary();
      table.uuid('formId').notNullable().references('id').inTable('form').index();
      table.uuid('submissionId').notNullable().references('id').inTable('form_submission').index();
      table.string('status').notNullable().defaultTo('queued').index();
      table.integer('attempts').notNullable().defaultTo(0);
      table.text('logs').nullable();
      // The file_storage id of the built package (link delivery). Set once the
      // package is built+stored so a retry resends the existing file instead of
      // rebuilding/re-uploading (avoids orphaned uploads). Null for the
      // attachment delivery path (nothing is stored).
      table.uuid('packageFileId').nullable().references('id').inTable('file_storage').onDelete('SET NULL');
      stamps(knex, table);
      table.unique(['formId', 'submissionId']);
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('submission_package_job'));
};
