const UPDATED_BY = 'enable-bcsc-idp-migration';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('identity_provider').where({ code: 'bcservicescard' }).update({
    active: true,
    updatedBy: UPDATED_BY,
    updatedAt: knex.fn.now(),
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('identity_provider')
    .where({ code: 'bcservicescard' })
    .update({
      active: false,
      updatedBy: `${UPDATED_BY}-rollback`,
      updatedAt: knex.fn.now(),
    });
};
