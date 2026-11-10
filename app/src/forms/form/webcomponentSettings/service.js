const Problem = require('api-problem');
const { UniqueViolationError } = require('objection');
const uuid = require('uuid');
const { FormWebcomponentSettings } = require('../../common/models');

const MAX_ALLOWED_ORIGINS = 20;
const MAX_ORIGIN_LENGTH = 255;
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

// Query helpers - extracted for easier mocking in tests
const queryHelpers = {
  findSettingsByFormId: async (formId) => {
    return await FormWebcomponentSettings.query().modify('filterFormId', formId).first();
  },

  updateSettings: async (id, data) => {
    return await FormWebcomponentSettings.query().findById(id).patch(data);
  },

  createSettings: async (data) => {
    return await FormWebcomponentSettings.query().insert(data);
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
  // An international domain name gets longer once converted, so check the result too
  return secure && bare && url.origin.length <= MAX_ORIGIN_LENGTH ? url.origin : null;
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

  // One row per form, so each write is a single statement and needs no transaction
  upsert: async (formId, data, currentUser) => {
    const allowedOrigins = service.validateSettings(data);
    const update = { allowedOrigins, updatedBy: currentUser.usernameIdp };

    const existing = await queryHelpers.findSettingsByFormId(formId);
    if (existing) {
      await queryHelpers.updateSettings(existing.id, update);
    } else {
      try {
        await queryHelpers.createSettings({ id: uuid.v4(), formId, allowedOrigins, createdBy: currentUser.usernameIdp });
      } catch (err) {
        // Another save created the row after the read above; this save then updates it
        if (!(err instanceof UniqueViolationError)) throw err;
        const created = await queryHelpers.findSettingsByFormId(formId);
        await queryHelpers.updateSettings(created.id, update);
      }
    }

    return await queryHelpers.findSettingsByFormId(formId);
  },
};

// Export query helpers for testing
service._queryHelpers = queryHelpers;
service.normalizeOrigin = normalizeOrigin;
service.MAX_ALLOWED_ORIGINS = MAX_ALLOWED_ORIGINS;

module.exports = service;
