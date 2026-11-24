/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('file_storage', (table) => {
      // The form a web component upload is for, so an API key only reaches its own form's draft files.
      // Null for other uploads, and for files uploaded before this column existed.
      table.uuid('formId').nullable().references('id').inTable('form').onDelete('SET NULL').index();
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('file_storage', (table) => {
      table.dropColumn('formId');
    })
  );
};
