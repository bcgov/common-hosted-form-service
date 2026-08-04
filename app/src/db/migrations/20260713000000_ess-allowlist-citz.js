/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('ess_allowlist').insert({
    accountName: 'UAGNMQLXPIVZJWWN4B75NY53OMUQPEHBMI4CTKAPAP42C4UDK2GJ3H42',
    notes: { msg: 'Account for CITZ, created for from request by  CHRROBIN@idir with confirmation id: 15F94F9E' },
    createdBy: 'ess_allowlist_citz_migration',
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('ess_allowlist').where({ accountName: 'UAGNMQLXPIVZJWWN4B75NY53OMUQPEHBMI4CTKAPAP42C4UDK2GJ3H42' }).del();
};
