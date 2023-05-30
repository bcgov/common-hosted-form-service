exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.boolean('allowSubmitterToUploadFile').notNullable().defaultTo(false).comment('This parameter allow submitter to load data from json file');
    })
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.dropColumn('allowSubmitterToUploadFile');
    })
  );
};
