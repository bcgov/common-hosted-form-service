/* eslint-env jest */

const { AuthTypes, AuthCombinations } = require('../../../../../src/runtime-auth/security/auth/types');

describe('auth/types', () => {
  it('should export all authentication type constants', () => {
    expect(AuthTypes.PUBLIC).toBe('public');
    expect(AuthTypes.USER_OIDC).toBe('userOidc');
    expect(AuthTypes.API_KEY_BASIC).toBe('apiKeyBasic');
    expect(AuthTypes.GATEWAY_BEARER).toBe('gatewayBearer');
  });

  it('should be frozen object for AuthTypes', () => {
    expect(Object.isFrozen(AuthTypes)).toBe(true);
  });

  it('should have string values for AuthTypes', () => {
    for (const type of Object.values(AuthTypes)) {
      expect(typeof type).toBe('string');
      expect(type.length).toBeGreaterThan(0);
    }
  });

  it('should export AUTHENTICATED combination', () => {
    expect(AuthCombinations.AUTHENTICATED).toEqual([AuthTypes.USER_OIDC]);
  });

  it('should export API_ONLY combination', () => {
    expect(AuthCombinations.API_ONLY).toEqual([AuthTypes.API_KEY_BASIC, AuthTypes.GATEWAY_BEARER]);
  });

  it('should export API_OR_USER combination', () => {
    expect(AuthCombinations.API_OR_USER).toEqual([AuthTypes.USER_OIDC, AuthTypes.API_KEY_BASIC]);
  });

  it('should export PUBLIC_ONLY combination', () => {
    expect(AuthCombinations.PUBLIC_ONLY).toEqual([AuthTypes.PUBLIC]);
  });

  it('should export PUBLIC_OR_USER combination', () => {
    expect(AuthCombinations.PUBLIC_OR_USER).toEqual([AuthTypes.PUBLIC, AuthTypes.USER_OIDC]);
  });

  it('should export ANY combination', () => {
    expect(AuthCombinations.ANY).toEqual([AuthTypes.PUBLIC, AuthTypes.USER_OIDC, AuthTypes.API_KEY_BASIC, AuthTypes.GATEWAY_BEARER]);
  });

  it('should be frozen object for AuthCombinations', () => {
    expect(Object.isFrozen(AuthCombinations)).toBe(true);
  });

  it('should have array values for AuthCombinations', () => {
    for (const combination of Object.values(AuthCombinations)) {
      expect(Array.isArray(combination)).toBe(true);
      expect(combination.length).toBeGreaterThan(0);
    }
  });
});
