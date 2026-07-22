/* eslint-env jest */

const makeAuthStrategies = require('../../../../../../src/runtime-auth/security/auth/strategies/index');

describe('auth/strategies/index', () => {
  let mockDeps;

  beforeEach(() => {
    mockDeps = {
      services: {
        jwtService: { getTokenPayload: jest.fn() },
        authService: { login: jest.fn(), readUser: jest.fn() },
        formService: { readApiKey: jest.fn() },
        gatewayService: { verifyTokenAndGetPayload: jest.fn() },
      },
    };
  });

  it('should return array of strategies', () => {
    const strategies = makeAuthStrategies(mockDeps);

    expect(Array.isArray(strategies)).toBe(true);
    expect(strategies.length).toBe(4);
  });

  it('should return strategies in correct order', () => {
    const strategies = makeAuthStrategies(mockDeps);

    expect(strategies[0].name).toBe('userOidc');
    expect(strategies[1].name).toBe('apiKeyBasic');
    expect(strategies[2].name).toBe('gatewayBearer');
    expect(strategies[3].name).toBe('public');
  });

  it('should pass deps to all strategies', () => {
    const strategies = makeAuthStrategies(mockDeps);

    for (const strategy of strategies) {
      expect(strategy.name).toBeDefined();
      expect(typeof strategy.canHandle).toBe('function');
      expect(typeof strategy.authenticate).toBe('function');
      expect(strategy.isPublic).toBeDefined();
    }
  });

  it('should have correct isPublic flags', () => {
    const strategies = makeAuthStrategies(mockDeps);

    expect(strategies[0].isPublic).toBe(false); // userOidc
    expect(strategies[1].isPublic).toBe(false); // apiKeyBasic
    expect(strategies[2].isPublic).toBe(false); // gatewayBearer
    expect(strategies[3].isPublic).toBe(true); // public
  });

  it('should handle missing services gracefully', () => {
    const strategiesWithMissingServices = makeAuthStrategies({});

    expect(Array.isArray(strategiesWithMissingServices)).toBe(true);
    expect(strategiesWithMissingServices.length).toBe(4);
  });

  it('should handle null deps gracefully', () => {
    const strategiesWithNullDeps = makeAuthStrategies(null);

    expect(Array.isArray(strategiesWithNullDeps)).toBe(true);
    expect(strategiesWithNullDeps.length).toBe(4);
  });
});
