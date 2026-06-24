const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.createTable('feature_flag', (table) => {
        table.uuid('id').primary();
        table.string('code').notNullable().unique().index();
        table.string('name');
        table.string('description');
        table.boolean('allowAll').notNullable().defaultTo(false);
        stamps(knex, table);
      })
    )
    .then(() =>
      knex.schema.createTable('feature_flag_form', (table) => {
        table.uuid('id').primary();
        table.uuid('featureFlagId').references('id').inTable('feature_flag').notNullable().index();
        table.uuid('formId').references('id').inTable('form').notNullable().index();
        table.unique(['featureFlagId', 'formId']);
        stamps(knex, table);
      })
    )
    .then(() =>
      knex.schema.createTable('feature_flag_tenant', (table) => {
        table.uuid('id').primary();
        table.uuid('featureFlagId').references('id').inTable('feature_flag').notNullable().index();
        table.uuid('tenantId').notNullable();
        table.unique(['featureFlagId', 'tenantId']);
        stamps(knex, table);
      })
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('feature_flag_tenant'))
    .then(() => knex.schema.dropTableIfExists('feature_flag_form'))
    .then(() => knex.schema.dropTableIfExists('feature_flag'));
};
