const stamps = require('../stamps');

/**
 * Metrics for document generation: one row per render attempt, recording which
 * form invoked which generator (CDOGS v2/v3), the outcome (success/fail/denied),
 * and timing. Append-only; written by the docGenService facade.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('form_document_generation', (table) => {
    table.bigIncrements('id').primary();
    // formId is a loose identifier (no FK), consistent with feature_flag_form: it
    // is a reporting key and must not block a hard form delete.
    table.uuid('formId').notNullable().index();
    // null for the draft path (no saved submission yet).
    table.uuid('submissionId').nullable().index();
    // 'v2' | 'v3' | 'none' (none when the request was denied before a generator was chosen).
    table.string('generatorVersion').notNullable();
    // 'success' | 'fail' | 'denied'.
    table.string('outcome').notNullable().index();
    table.integer('httpStatus').nullable();
    table.integer('durationMs').nullable();
    table.text('errorDetail').nullable();
    table.uuid('tenantId').nullable();
    stamps(knex, table);
    table.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('form_document_generation');
};
