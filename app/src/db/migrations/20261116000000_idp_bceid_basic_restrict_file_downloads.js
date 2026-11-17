const UPDATED_BY = 'idp_bceid_basic_restrict_file_downloads';

// Basic BCeID accounts can be created in bulk, so their users are treated as
// public for file access (see forms/file/middleware/filePermissions.js).
const NEW_EXTRAS = {
  restrictFileDownloads: true,
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('identity_provider')
    .where({ code: 'bceid-basic' })
    .update({
      extra: knex.raw("COALESCE(extra, '{}'::jsonb) || ?::jsonb", [JSON.stringify(NEW_EXTRAS)]),
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
    .where({ code: 'bceid-basic' })
    .update({
      extra: knex.raw("extra - 'restrictFileDownloads'"),
      updatedBy: UPDATED_BY,
      updatedAt: knex.fn.now(),
    });
};
