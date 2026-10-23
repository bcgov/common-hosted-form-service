const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('form_webcomponent_settings', (table) => {
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index().unique().onDelete('CASCADE');
      // Origins (scheme://host[:port]) allowed to embed a Public form without an API key
      table.jsonb('allowedOrigins').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
      stamps(knex, table);
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('form_webcomponent_settings'));
};
