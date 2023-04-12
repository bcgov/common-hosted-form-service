exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form_submission', (table) => {
      table.uuid('idBulkFile').references('id').inTable('bulk_file_storage').nullable().index().comment('This FK allow to group file by file submission');
    })
  );
};
exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.dropColumn('idBulkFile');
    })
  );
};
