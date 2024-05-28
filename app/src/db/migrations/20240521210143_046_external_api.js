const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('external_api', (table) => {
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.string('name', 255).notNullable();
      table.string('endpointUrl').notNullable();

      table.boolean('sendApiKey').defaultTo(false);
      table.string('apiKeyHeader');
      table.string('apiKey');

      table.boolean('sendUserToken').defaultTo(false);
      table.string('userTokenHeader');
      table.boolean('userTokenBearer').defaultTo(true);

      table.boolean('sendUserInfo').defaultTo(false);
      table.string('userInfoHeader');
      table.boolean('userInfoEncrypted').defaultTo(false);
      table.string('userInfoEncryptionKey');
      table.string('userInfoEncryptionAlgo');
      stamps(knex, table);
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('external_api'));
};
