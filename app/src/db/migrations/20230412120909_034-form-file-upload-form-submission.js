const stamps = require('../stamps');

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('bulk_file_storage', (table) => {
      table.uuid('id').primary();
      table.string('originalName', 1024).notNullable();
      table.string('description', 1024).nullable();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.uuid('userIdBf').references('id').inTable('user').nullable().index();
      stamps(knex, table);
    })
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('bulk_file_storage'));
};
