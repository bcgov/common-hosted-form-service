const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('form_group', (table) => {
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.uuid('groupId').notNullable();
      table.unique(['formId', 'groupId']);
      stamps(knex, table);
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('form_group'));
};
