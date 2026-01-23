/**
 * Shared API key validation utilities for apiKeyBasic and gatewayBearer strategies
 */

const ERRORS = require('../../errorMessages');

// Timing-safe credential validation
function safeCompare(a, b) {
  if (a === b) return true; // Quick path for identical strings (including empty strings)
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.codePointAt(i) ^ b.codePointAt(i);
  }
  return result === 0;
}

/**
 * Validates API key credentials against stored API key record
 * @param {string} providedApiKey - API key from credentials/token payload
 * @param {Object} apiKeyRecord - API key record from formService.readApiKey()
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails with 401 status
 */
function validateApiKey(providedApiKey, apiKeyRecord) {
  if (!apiKeyRecord || !apiKeyRecord.secret) {
    const err = new Error(ERRORS.FORM_OR_API_KEY_NOT_FOUND);
    err.status = 401;
    throw err;
  }

  if (!safeCompare(providedApiKey, apiKeyRecord.secret)) {
    const err = new Error(ERRORS.INVALID_CREDENTIALS);
    err.status = 401;
    throw err;
  }

  return true;
}

module.exports = {
  safeCompare,
  validateApiKey,
};
