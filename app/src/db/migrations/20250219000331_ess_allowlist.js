const stamps = require('../stamps');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.createTable('ess_allowlist', (table) => {
        table.string('accountName').primary();
        table.jsonb('notes');
        stamps(knex, table);
      })
    )
    .then(() =>
      knex.schema.alterTable('form_event_stream_config', (table) => {
        table.string('accountName').comment('ESS Account name, must be in ess_allowlist to enable ESS streams');
      })
    )
    .then(() => {
      const dummydata = {
        accountName: 'UCT3KJ7BCOK3ZH5KSAJTHL3WRB5CX2MJ2XMKX2R7FRZUAUYC427TGESZ',
        notes: { msg: 'A CHEFS developer ESS account. You will need to know the Seed (private key) to connect.' },
        createdBy: 'ess_allowlist_migration',
      };
      return knex('ess_allowlist').insert(dummydata);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.alterTable('form_event_stream_config', (table) => {
        table.dropColumn('accountName');
      })
    )
    .then(() => knex.schema.dropTableIfExists('ess_allowlist'));
};
