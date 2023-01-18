const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('form_components_proactive_help',table=>{
      table.uuid('id').primary();
      table.string('componentname').notNullable();
      table.string('externallink');
      table.binary('image');
      table.string('imagetype');
      table.string('componentimagename');
      table.string('groupname').notNullable();
      table.text('description');
      table.boolean('islinkenabled').defaultTo(false);
      table.boolean('publishstatus').defaultTo(false);
      stamps(knex, table);
    }));
};


exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('form_components_proactive_help'));
};
