const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
      knex.schema.createTable('form_allowed_domains', (table) => {
        table.uuid('id').primary();
        table.uuid('formId').references('id').inTable('form').notNullable().index();
        table.string('domain');
        stamps(knex, table);
      })
    )
    .then(() =>
      knex.schema.createTable('form_requested_domains', (table) => {
        table.uuid('id').primary();
        table.uuid('formId').references('id').inTable('form').notNullable().index();
        table.string('domain');
        table.string('status').defaultTo('pending'); // pending, approved, rejected
        table.text('reason').nullable();
        table.timestamp('requestedAt', { useTz: true }).defaultTo(knex.fn.now());
        table.string('requestedBy').notNullable();
        table.timestamp('reviewedAt', { useTz: true }).nullable();
        table.string('reviewedBy').nullable();
      })
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('form_requested_domains'))
    .then(() => knex.schema.dropTableIfExists('form_allowed_domains'));
};
