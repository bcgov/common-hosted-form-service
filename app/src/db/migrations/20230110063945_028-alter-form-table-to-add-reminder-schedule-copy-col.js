exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.jsonb('schedule').comment('Form level Schedule settings.');
      table.boolean('reminder_enabled').comment('Form level reminder settings.');
      table.boolean('enableCopyExistingSubmission').notNullable().defaultTo(false).comment('Form level feature settings.');
    })
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.dropColumn('schedule');
      table.dropColumn('reminder_enabled');
      table.dropColumn('enableCopyExistingSubmission');
    })
  );
};
