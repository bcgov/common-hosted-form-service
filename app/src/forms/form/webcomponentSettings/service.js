const Problem = require('api-problem');
const uuid = require('uuid');
const { FormWebcomponentSettings } = require('../../common/models');

const MAX_ALLOWED_ORIGINS = 20;
const MAX_ORIGIN_LENGTH = 255;
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

// Query helpers - extracted for easier mocking in tests
const queryHelpers = {
  findSettingsByFormId: async (formId, trx) => {
    return await FormWebcomponentSettings.query(trx).modify('filterFormId', formId).first();
  },

  startTransaction: async () => {
    return await FormWebcomponentSettings.startTransaction();
  },

  updateSettings: async (id, data, trx) => {
    return await FormWebcomponentSettings.query(trx).findById(id).patch(data);
  },

  createSettings: async (data, trx) => {
    return await FormWebcomponentSettings.query(trx).insert(data);
  },
};

/**
 * Normalise an origin to scheme://host[:port], lowercased and without a default port.
 * Returns null unless it is an https origin, or an http origin on localhost.
 * @param {string} value the origin to normalise
 * @returns {string|null} the normalised origin, or null when it is not allowed
 */
function normalizeOrigin(value) {
  if (typeof value !== 'string' || value.length > MAX_ORIGIN_LENGTH) return null;

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  const secure = url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTNAMES.has(url.hostname));
  // An origin has no credentials, path, query, fragment or wildcard
  const bare = !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash && !url.hostname.includes('*');
  return secure && bare ? url.origin : null;
}

const service = {
  validateSettings: (data) => {
    if (!data || !Array.isArray(data.allowedOrigins)) {
      throw new Problem(422, { detail: `'allowedOrigins' must be an array.` });
    }
    if (data.allowedOrigins.length > MAX_ALLOWED_ORIGINS) {
      throw new Problem(422, { detail: `'allowedOrigins' can have at most ${MAX_ALLOWED_ORIGINS} entries.` });
    }

    const origins = data.allowedOrigins.map(normalizeOrigin);
    const invalid = data.allowedOrigins.filter((_origin, index) => origins[index] === null);
    if (invalid.length) {
      throw new Problem(422, {
        detail: `'allowedOrigins' entries must be https origins such as https://www.example.com, or http://localhost.`,
        invalidOrigins: invalid,
      });
    }

    const duplicates = origins.filter((origin, index) => origins.indexOf(origin) !== index);
    if (duplicates.length) {
      throw new Problem(422, { detail: `'allowedOrigins' has duplicate entries.`, duplicateOrigins: [...new Set(duplicates)] });
    }

    return origins;
  },

  readSettings: async (formId) => {
    const result = await queryHelpers.findSettingsByFormId(formId);
    return result || null;
  },

  // Normalised origins allowed to embed the form without an API key
  readAllowedOrigins: async (formId) => {
    const result = await queryHelpers.findSettingsByFormId(formId);
    return result?.allowedOrigins || [];
  },

  upsert: async (formId, data, currentUser) => {
    const allowedOrigins = service.validateSettings(data);

    let trx;
    try {
      trx = await queryHelpers.startTransaction();

      const existing = await queryHelpers.findSettingsByFormId(formId, trx);
      if (existing) {
        await queryHelpers.updateSettings(existing.id, { allowedOrigins, updatedBy: currentUser.usernameIdp }, trx);
      } else {
        await queryHelpers.createSettings({ id: uuid.v4(), formId, allowedOrigins, createdBy: currentUser.usernameIdp }, trx);
      }

      await trx.commit();
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }

    return await queryHelpers.findSettingsByFormId(formId);
  },
};

// Export query helpers for testing
service._queryHelpers = queryHelpers;
service.normalizeOrigin = normalizeOrigin;
service.MAX_ALLOWED_ORIGINS = MAX_ALLOWED_ORIGINS;

module.exports = service;
