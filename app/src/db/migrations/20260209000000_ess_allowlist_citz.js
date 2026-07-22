/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('ess_allowlist').insert({
    accountName: 'UAWQEZ5GQAKF56UZSYLRSBAH543LOWNO5SGXEPHS25CGGTTAWOY5AFNS',
    notes: { msg: 'Account for CITZ, created for from request by TSCHARIE@idir with confirmation id: D3C6B4F1' },
    createdBy: 'ess_allowlist_citz_migration',
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('ess_allowlist').where({ accountName: 'UAWQEZ5GQAKF56UZSYLRSBAH543LOWNO5SGXEPHS25CGGTTAWOY5AFNS' }).del();
};
