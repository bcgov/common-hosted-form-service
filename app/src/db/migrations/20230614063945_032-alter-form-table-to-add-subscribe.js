exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.jsonb('subscribe').comment('Form subscibe settings.');
    })
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.dropColumn('subscribe');
    })
  );
};
