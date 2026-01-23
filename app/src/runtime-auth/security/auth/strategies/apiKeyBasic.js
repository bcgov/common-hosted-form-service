/**
 * apiKeyBasic: Authorization: Basic base64(formId:apiKey)
 * Uses CHEFS formService.readApiKey() for validation
 */

const ERRORS = require('../../errorMessages');
const { validateApiKey } = require('../utils/apiKeyValidation');
const { createApiKeyAuthResult } = require('../utils/authResult');

function canHandle(req) {
  const h = req.headers?.authorization || '';
  return /^Basic\s+/i.test(h);
}

function parseBasicPair(header) {
  try {
    const base64 = header.replace(/^Basic\s+/i, '');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { formId: decoded.slice(0, idx), apiKey: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

module.exports = function apiKeyBasicFactory({ deps }) {
  const { formService, authService } = deps.services || {};

  async function authenticate(req) {
    try {
      const authz = req.headers.authorization;
      const pair = parseBasicPair(authz || '');

      if (!pair) {
        const err = new Error(ERRORS.INVALID_BASIC_FORMAT);
        err.status = 401;
        throw err;
      }
      const { formId, apiKey } = pair;

      // Use CHEFS formService to read API key
      const apiKeyRecord = await formService?.readApiKey?.(formId);

      // Validate credentials (throws 401 on failure)
      validateApiKey(apiKey, apiKeyRecord);

      // Fetch real user data from database
      const user = await authService.readUser('runtime-auth-api-user');

      return createApiKeyAuthResult({
        authType: 'apiKey',
        strategyName: 'apiKeyBasic',
        actorType: 'apiKey',
        user,
        formId,
        apiKeyRecord,
        claims: { formId },
      });
    } catch (e) {
      const err = new Error(ERRORS.USER_NOT_FOUND);
      err.status = 401;
      err.cause = e;
      err.message = e?.message || ERRORS.USER_NOT_FOUND;
      throw err;
    }
  }

  return { name: 'apiKeyBasic', isPublic: false, canHandle, authenticate };
};
