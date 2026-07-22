const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('form_submission_package_settings', (table) => {
      table.uuid('id').primary();
      table.uuid('formId').notNullable().unique().references('id').inTable('form').onDelete('CASCADE').index();
      table.boolean('enabled').notNullable().defaultTo(false);
      table.uuid('templateId').nullable().references('id').inTable('document_template').onDelete('SET NULL');
      table.specificType('emails', 'text ARRAY').comment('Array of email addresses to receive the submission package.');
      stamps(knex, table);
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('form_submission_package_settings'));
};
