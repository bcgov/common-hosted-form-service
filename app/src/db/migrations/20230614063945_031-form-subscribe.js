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
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS subscription_vw'))
    .then(() => knex.schema.dropTableIfExists('form_subscription'));
};
