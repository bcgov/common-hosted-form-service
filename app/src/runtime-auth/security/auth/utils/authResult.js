/**
 * Utility functions for creating standardized authentication result objects
 * Used by authentication strategies to ensure consistent structure
 */

/**
 * Create authentication result object for API key-based strategies (apiKeyBasic, gatewayBearer)
 * @param {Object} params - Parameters for building auth result
 * @param {string} params.authType - Authentication type (e.g., 'apiKey', 'gateway')
 * @param {string} params.strategyName - Strategy name (e.g., 'apiKeyBasic', 'gatewayBearer')
 * @param {string} params.actorType - Actor type (e.g., 'apiKey', 'gateway')
 * @param {Object} params.user - User object from database
 * @param {string} params.formId - Form ID (required for API key strategies)
 * @param {Object} params.apiKeyRecord - API key record with filesApiAccess property
 * @param {Object} params.claims - Claims object to include in result
 * @returns {Object} Authentication result object
 */
function createApiKeyAuthResult({ authType, strategyName, actorType, user, formId, apiKeyRecord, claims }) {
  return {
    authType,
    strategyName,
    actor: {
      type: actorType,
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      idpCode: user.idpCode,
      idpUserId: user.idpUserId,
      keycloakId: user.keycloakId,
      formId,
      metadata: {
        filesApiAccess: apiKeyRecord?.filesApiAccess,
        apiKeyMetadata: {
          filesApiAccess: apiKeyRecord?.filesApiAccess,
        },
        // Include all user fields for currentUser generation
        ...user,
      },
    },
    claims,
  };
}

module.exports = {
  createApiKeyAuthResult,
};
