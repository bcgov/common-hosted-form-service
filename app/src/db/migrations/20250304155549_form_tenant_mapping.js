const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('form_tenant_mapping', (table) => {
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.uuid('tenantId').notNullable();
      table.unique(['formId', 'tenantId']);
      stamps(knex, table);
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('form_tenant_mapping'));
};
