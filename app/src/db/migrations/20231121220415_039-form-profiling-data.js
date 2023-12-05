
const stamps = require('../stamps');

exports.up = function (knex) {
    return Promise.resolve()
        .then(() => knex.schema.createTable('label', table => {
            table.uuid('id').primary();
            table.uuid('userId').references('id').inTable('user').notNullable().index();
            table.string('labelText');
            stamps(knex, table);
        }))
        .then(() => knex.schema.alterTable('form', table => {
            table.string('deploymentLevel').notNullable().defaultTo('');
            table.string('ministry').notNullable().defaultTo('');
            table.boolean('apiIntegration').nullable().comment('Use of API integrations');
            table.string('useCase').notNullable().defaultTo('').comment('Explains the use case for this particualar form');

        }));
};

exports.down = function (knex) {
    return Promise.resolve()
        .then(() => knex.schema.alterTable('form', table => {
            table.dropColumn('deploymentLevel');
            table.dropColumn('ministry');
            table.dropColumn('apiIntegration');
            table.dropColumn('useCase');
        }).then(() => knex.schema.dropTableIfExists('label'))
        );
};
