/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('ess_allowlist').insert({
    accountName: 'UCPD6DP2L7ECP7VKAMTHBYK7KOCSOVU65HHQTC5FB2NM53LV7XUGTT4P',
    notes: { msg: 'Account for SDPR, created for from request by KGILLANI@idir with confirmation id: C3A65C9D' },
    createdBy: 'ess_allowlist_sdpr_migration',
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('ess_allowlist').where({ accountName: 'UCPD6DP2L7ECP7VKAMTHBYK7KOCSOVU65HHQTC5FB2NM53LV7XUGTT4P' }).del();
};
