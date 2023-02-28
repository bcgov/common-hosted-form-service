const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('file_storage_reservation',table=>{
      table.uuid('id').primary();
      table.string('fileId');
      table.boolean('ready').defaultTo(false);
      stamps(knex, table);
    }));
};


exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('file_storage_reservation'));
};
