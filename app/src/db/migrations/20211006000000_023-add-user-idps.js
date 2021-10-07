exports.up = function (knex) {
  return Promise.resolve()
    // Add optional idpCode foreign key column
    .then(() => knex.schema.alterTable('user', table => {
      table.string('idpCode').references('code').inTable('identity_provider').comment('The associated identity provider');
    }))
    // Set idpCode to 'idir'
    .then(() => knex('user').update({ idpCode: 'idir' }));
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('user', table => {
      table.dropColumn('idpCode');
    }));
};
