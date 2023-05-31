const stamps = require('../stamps');

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('file_storage', (table) => {
      table.uuid('id').primary();
      table.string('originalName', 1024).notNullable();
      table.string('mimeType').notNullable();
      table.integer('size').notNullable();
      table.enu('storage', ['uploads', 'localStorage', 'objectStorage']).notNullable().defaultTo('uploads');
      table.string('path', 1024).notNullable();
      table.uuid('formSubmissionId').references('id').inTable('form_submission').nullable().index();
      stamps(knex, table);
    })
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('file_storage'));
};
