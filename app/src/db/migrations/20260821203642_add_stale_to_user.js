exports.up = async function (knex) {
  await knex.schema.alterTable('user', (table) => {
    table.boolean('stale').notNullable().defaultTo(false).comment('Whether the user has been identified as stale.');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('user', (table) => {
    table.dropColumn('stale');
  });
};
