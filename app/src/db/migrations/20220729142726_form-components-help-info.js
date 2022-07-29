const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('form_components_help_info',table=>{
      table.uuid('id').primary();
      table.string('componentname').notNullable();
      table.string('morehelpinfolink',500);
      table.string('imageurl',500);
      table.integer('versions').notNullable();
      table.string('groupname').notNullable();
      table.text('description').notNullable();
      table.boolean('publishstatus').defaultTo(false);
      table.unique(['componentname', 'versions']);
      stamps(knex, table);
    }));
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('form_components_help_info'));
};
