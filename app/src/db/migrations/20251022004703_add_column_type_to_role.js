/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('role', (table) => {
      table.string('type', 255).notNullable().defaultTo('classic').comment('Role type: classic or enterprise');
      table.index('type');
    })
    .then(() => {
      // Update form_admin to enterprise type
      return knex('role').where('code', 'form_admin').update({ type: 'enterprise' });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('role', (table) => {
    table.dropIndex('type');
    table.dropColumn('type');
  });
};
