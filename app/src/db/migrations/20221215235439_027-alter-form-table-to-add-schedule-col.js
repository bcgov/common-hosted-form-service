exports.up = function(knex) {
  return Promise.resolve()
  // create new collumn to store Schedule (Period) setting
    .then(() => knex.schema.alterTable('form', table => {
      table.jsonb('schedule').comment('Form level Schedule settings.');
    }));
};

exports.down = function(knex) {
  return Promise.resolve()
  // undo the new field add
    .then(() => knex.schema.alterTable('form', table => {
      table.dropColumn('schedule');
    }));
};
