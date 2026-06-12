/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('form', (table) => {
    table.boolean('enableSubmissionPackageEmail').notNullable().defaultTo(false);

    table.uuid('submissionCompletionTemplateId').nullable();

    table.foreign('submissionCompletionTemplateId').references('id').inTable('document_template').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.down = function (knex) {
  return knex.schema.alterTable('form', (table) => {
    table.dropForeign(['submissionCompletionTemplateId']);

    table.dropColumn('submissionCompletionTemplateId');

    table.dropColumn('enableSubmissionPackageEmail');
  });
};
