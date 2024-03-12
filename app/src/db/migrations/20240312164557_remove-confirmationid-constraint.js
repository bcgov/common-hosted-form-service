/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form_submission', (table) => {
      table.dropUnique('confirmationId');
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form_submission', (table) => {
      table.unique('confirmationId');
    })
  );
};
