/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('user_login_history', (table) => {
      table.uuid('userId').notNullable().references('id').inTable('user').index();
      table.string('idpCode').notNullable();
      table.timestamp('lastLoginAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.primary(['userId', 'idpCode']);
    })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('user_login_history'));
};
