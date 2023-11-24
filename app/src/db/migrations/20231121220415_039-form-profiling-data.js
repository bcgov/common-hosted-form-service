
const stamps = require('../stamps');

exports.up = function (knex) {
    return Promise.resolve()
        .then(() => knex.schema.createTable('label', table => {
            table.uuid('id').primary();
            table.uuid('userId').references('id').inTable('user').notNullable().index();
            table.string('labelDescription');
            stamps(knex, table);
        }))
        .then(() => knex.schema.alterTable('form', table => {
            table.string('deploymentLevel').notNullable().defaultTo('');
            table.string('ministry').notNullable().defaultTo('');
            table.boolean('apiIntegration').notNullable().defaultTo(false).comment('Use of API integrations');
            table.boolean('funding').notNullable().defaultTo(false).comment('Inquires if the use of CHEFS enabled creator to avoid requesting funding');
            table.decimal('fundingCost').comment('Optional projected cost of funds');
            table.string('useCase').notNullable().defaultTo('').comment('Explains the use case for this particualar form');

        }));
};

exports.down = function (knex) {
    return Promise.resolve()
        .then(() => knex.schema.alterTable('form', table => {
            table.dropColumn('deploymentLevel');
            table.dropColumn('ministry');
            table.dropColumn('apiIntegration');
            table.dropColumn('funding');
            table.dropColumn('fundingCost');
            table.dropColumn('useCase');
        }).then(() => knex.schema.dropTableIfExists('label'))
        );
};
