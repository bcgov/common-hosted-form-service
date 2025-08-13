exports.up = function (knex) {
  return knex.schema.alterTable('form', (table) => {
    table.boolean('enableAutoSave').notNullable().defaultTo(false).comment('When true, form data is automatically saved to protect against browser crashes and refreshes');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('form', (table) => {
    table.dropColumn('enableAutoSave');
  });
};
