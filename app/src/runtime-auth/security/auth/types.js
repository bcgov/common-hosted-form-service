/**
 * Authentication type constants
 * Use these instead of magic strings for allowedAuth
 */

const AuthTypes = Object.freeze({
  PUBLIC: 'public',
  USER_OIDC: 'userOidc',
  API_KEY_BASIC: 'apiKeyBasic',
  GATEWAY_BEARER: 'gatewayBearer',
});

/**
 * Common auth type combinations
 */
const AuthCombinations = Object.freeze({
  /**
   * Any authenticated user (no public)
   */
  AUTHENTICATED: [AuthTypes.USER_OIDC],

  /**
   * Any API key or gateway token (no user, no public)
   */
  API_ONLY: [AuthTypes.API_KEY_BASIC, AuthTypes.GATEWAY_BEARER],

  /**
   * User OIDC or API key (not gateway)
   */
  API_OR_USER: [AuthTypes.USER_OIDC, AuthTypes.API_KEY_BASIC],

  /**
   * Public only (no authentication)
   */
  PUBLIC_ONLY: [AuthTypes.PUBLIC],

  /**
   * Public or authenticated users (common for public forms)
   */
  PUBLIC_OR_USER: [AuthTypes.PUBLIC, AuthTypes.USER_OIDC],

  /**
   * Any authentication method
   */
  ANY: [AuthTypes.PUBLIC, AuthTypes.USER_OIDC, AuthTypes.API_KEY_BASIC, AuthTypes.GATEWAY_BEARER],
});

module.exports = { AuthTypes, AuthCombinations };
