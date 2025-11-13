/**
 * gatewayBearer: Bearer <local-jwt> (signed with local key).
 * Payload MUST provide { formId, apiKey } which is validated same as Basic.
 * Uses CHEFS gatewayService and formService
 */

const ERRORS = require('../../errorMessages');
const { validateApiKey } = require('../utils/apiKeyValidation');
const { createApiKeyAuthResult } = require('../utils/authResult');

function canHandle(req) {
  const h = req.headers?.authorization || '';
  // Same header shape as user; policy/order selects which runs first
  return /^Bearer\s+/i.test(h);
}

module.exports = function gatewayBearerFactory({ deps }) {
  const { gatewayService, formService, authService } = deps.services || {};

  async function authenticate(req) {
    try {
      const authz = req.headers.authorization;
      if (!authz) {
        const err = new Error(ERRORS.MISSING_AUTHORIZATION);
        err.status = 401;
        throw err;
      }
      const token = authz.replace(/^Bearer\s+/i, '').trim();

      // Use CHEFS gatewayService to verify token
      const result = await gatewayService?.verifyTokenAndGetPayload?.(token);
      if (!result?.valid) {
        const err = new Error(ERRORS.INVALID_GATEWAY_TOKEN);
        err.status = 401;
        throw err;
      }

      const payload = result.payload || {};
      const { formId, apiKey } = payload || {};
      if (!formId) {
        const err = new Error(ERRORS.GATEWAY_TOKEN_MISSING_CLAIMS);
        err.status = 401;
        throw err;
      }

      // Use CHEFS formService to read API key
      const apiKeyRecord = await formService?.readApiKey?.(formId);

      // Validate credentials if apiKey is in payload (throws 401 on failure)
      if (apiKey !== undefined) {
        validateApiKey(apiKey, apiKeyRecord);
      }

      // Fetch real user data from database
      const user = await authService.readUser('runtime-auth-gateway-user');

      return createApiKeyAuthResult({
        authType: 'gateway',
        strategyName: 'gatewayBearer',
        actorType: 'gateway',
        user,
        formId,
        apiKeyRecord,
        claims: payload,
      });
    } catch (e) {
      const err = new Error(ERRORS.USER_NOT_FOUND);
      err.status = 401;
      err.cause = e;
      err.message = e?.message || ERRORS.USER_NOT_FOUND;
      throw err;
    }
  }

  return { name: 'gatewayBearer', isPublic: false, canHandle, authenticate };
};
