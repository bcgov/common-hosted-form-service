const stamps = require('../stamps');

exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('user_form_preferences', table => {
      table.primary(['userId', 'formId']);
      table.uuid('userId').references('id').inTable('user').notNullable();
      table.uuid('formId').references('id').inTable('form').notNullable();
      table.jsonb('preferences');
      stamps(knex, table);
    }));
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('user_form_preferences'));
};
