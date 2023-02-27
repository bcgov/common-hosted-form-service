const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('submission_to_csv_storage',table=>{
      table.uuid('id').primary();
      table.uuid('userId');
      table.integer('version');
      table.uuid('formId');
      table.jsonb('file');
      table.boolean('ready').defaultTo(false);
      stamps(knex, table);
    }));
};


exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('submission_to_csv_storage'));
};
