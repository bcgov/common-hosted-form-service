const UPDATED_BY = 'idp_bceid_basic_access_settings';

// Merge into the existing extra so the BCeID userSearch/addTeamMemberSearch config is preserved.
const NEW_EXTRAS = {
  sortOrder: 50, // move bceid-basic below bceid-business (40)
  formAccessSettings: 'bceid-basic', // gets its own form settings message block
};

const OLD_EXTRAS = {
  sortOrder: 30,
  formAccessSettings: 'idim',
};

const merge = (knex, extras) => knex.raw('extra || ?::jsonb', [JSON.stringify(extras)]);

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('identity_provider').where({ code: 'bceid-basic' }).update({
    extra: merge(knex, NEW_EXTRAS),
    updatedBy: UPDATED_BY,
    updatedAt: knex.fn.now(),
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('identity_provider').where({ code: 'bceid-basic' }).update({
    extra: merge(knex, OLD_EXTRAS),
    updatedBy: UPDATED_BY,
    updatedAt: knex.fn.now(),
  });
};
