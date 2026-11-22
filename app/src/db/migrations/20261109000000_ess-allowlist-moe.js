/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('ess_allowlist').insert({
    accountName: 'UDDZ5DCYLELQTIFXZJXYSAGBYHNVTEWCKC732JJZHOIXKWCXCZTKU7KU',
    notes: { msg: 'Account for MOE, created for from request by AWILCOX@idir with confirmation id: E74C3634' },
    createdBy: 'ess_allowlist_moe_migration',
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('ess_allowlist').where({ accountName: 'UDDZ5DCYLELQTIFXZJXYSAGBYHNVTEWCKC732JJZHOIXKWCXCZTKU7KU' }).del();
};
