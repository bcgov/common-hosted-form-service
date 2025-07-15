const stamps = require('../stamps');

exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.createTable('form_subscription', (table) => {
        table.uuid('id').primary();
        table.uuid('formId').references('id').inTable('form').notNullable().index();
        table.string('subscribeEvent');
        table.string('endpointUrl').notNullable();
        table.string('endpointToken').notNullable();
        table.string('key').notNullable();
        stamps(knex, table);
      })
    )
    .then(() =>
      knex.schema.alterTable('form', (table) => {
        table.jsonb('subscribe').comment('Form subscibe settings.');
      })
    );
};

exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .alterTable('form', (table) => {
        table.dropColumn('subscribe');
      })
      .then(() => knex.schema.dropTableIfExists('form_subscription'))
  );
};
