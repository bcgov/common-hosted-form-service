const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('file_storage_reservation',table=>{
      table.uuid('id').primary();
      table.string('fileId');
      table.boolean('ready').defaultTo(false);
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('submissions_export', table => {
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.uuid('formVersionId').references('id').inTable('form_version').notNullable().index();
      table.uuid('reservationId').references('id').inTable('file_storage_reservation').notNullable().index();
      table.uuid('userId').references('id').inTable('user').notNullable().index();
      stamps(knex, table);
    }));
};


exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('submissions_export'))
    .then(() => knex.schema.dropTableIfExists('file_storage_reservation'));
};
