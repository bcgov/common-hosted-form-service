exports.up = (knex) =>
  knex.schema.createTable('turnstile_spent_proof', (table) => {
    table.string('id', 64).primary();
    table.timestamp('expiresAt', { useTz: true }).notNullable().index();
  });

exports.down = (knex) => knex.schema.dropTable('turnstile_spent_proof');
