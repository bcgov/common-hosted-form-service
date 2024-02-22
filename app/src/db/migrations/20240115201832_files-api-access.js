/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('form_api_key', table => {
      table.boolean('filesApiAccess').defaultTo(false).comment('Keeps track of whether files can be accessed using the API key');
    }));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('form_api_key', table => {
      table.dropColumn('filesApiAccess');
    }));
};
