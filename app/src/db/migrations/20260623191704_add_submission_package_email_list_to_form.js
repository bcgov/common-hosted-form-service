/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('form', (table) => {
    table.specificType('submissionPackageEmails', 'text ARRAY').comment('Array of email addresses to receive submission package emails.');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('form', (table) => {
    table.dropColumn('submissionPackageEmails');
  });
};
