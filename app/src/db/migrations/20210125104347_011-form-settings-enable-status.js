
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('form', table => {
      table.boolean('enableStatusUpdates').notNullable().defaultTo(false).comment('When true, submissions of this form will have status updates available');
    }));
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('form', table => {
      table.dropColumn('enableStatusUpdates');
    }));
};
