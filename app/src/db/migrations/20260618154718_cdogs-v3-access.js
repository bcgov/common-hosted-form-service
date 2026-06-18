const { v4: uuidv4 } = require('uuid');
const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('cdogs_v3_config', (table) => {
      table.uuid('id').primary().defaultTo(uuidv4());
      table.uuid('formId').notNullable().unique().references('id').inTable('form').onDelete('CASCADE').comment('Form ID this config applies to');
      table.boolean('enabled').defaultTo(false).comment('Whether CDOGS v3 is enabled for this form');
      stamps(knex, table);

      table.index(['formId']);
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('cdogs_v3_config'));
};
