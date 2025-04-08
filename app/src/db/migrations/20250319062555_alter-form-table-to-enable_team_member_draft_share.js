/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return Promise.resolve().then(() =>
      knex.schema.alterTable('form', (table) => {
        table.boolean('enableTeamMemberDraftShare').notNullable().defaultTo(false);
      })
    );
  };
  
  exports.down = function (knex) {
    return Promise.resolve().then(() =>
      knex.schema.alterTable('form', (table) => {
        table.dropColumn('enableTeamMemberDraftShare');
      })
    );
  };
