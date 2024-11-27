const stamps = require('../stamps');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.createTable('form_encryption_key', (table) => {
        table.uuid('id').primary();
        table.uuid('formId').references('id').inTable('form').notNullable().index();
        table.string('name', 255).notNullable();
        table.string('algorithm');
        table.string('key');
        stamps(knex, table);
      })
    )
    .then(() =>
      knex.schema.createTable('form_event_stream_config', (table) => {
        table.uuid('id').primary();
        table.uuid('formId').references('id').inTable('form').notNullable().index();
        table.boolean('enablePublicStream').defaultTo(false);
        table.boolean('enablePrivateStream').defaultTo(false);
        table.uuid('encryptionKeyId').references('id').inTable('form_encryption_key');
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
    .then(() => knex.schema.dropTableIfExists('form_event_stream_config'))
    .then(() => knex.schema.dropTableIfExists('form_encryption_keys'));
};
