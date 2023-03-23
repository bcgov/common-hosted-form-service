exports.up = function(knex) {
  return Promise.resolve()
    // create new collumn to store Enable/disable feature setting (Copy from existing submission)
    .then(() => knex.schema.alterTable('form', table => {
      table.boolean('enableCopyExistingSubmission').notNullable().defaultTo(false).comment('Form level feature settings.');
    }));
};
exports.down = function(knex) {
  return Promise.resolve()
    // undo the new field add
    .then(() => knex.schema.alterTable('form', table => {
      table.dropColumn('enableCopyExistingSubmission');
    }));
};
