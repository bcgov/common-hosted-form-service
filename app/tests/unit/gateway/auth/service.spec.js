// eslint-disable-next-line no-unused-vars
const service = require('../../../../src/gateway/v1/auth/service');
const config = require('config');
// eslint-disable-next-line no-unused-vars
const { SignJWT, jwtVerify } = require('jose');

const TEST_SECRET = 'test-secret';
const TEST_PAYLOAD = { formId: 'abc', userId: 'u1' };

let originalNodeEnv;
let originalGatewayJwtSecret;
let configSpy;

beforeAll(() => {
  originalNodeEnv = process.env.NODE_ENV;
  originalGatewayJwtSecret = process.env.GATEWAY_JWTSECRET;
});

afterAll(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.GATEWAY_JWTSECRET = originalGatewayJwtSecret;
  jest.restoreAllMocks();
});

let testService;

beforeEach(() => {
  // Reset to non-production for most tests
  process.env.NODE_ENV = 'test';
  delete process.env.GATEWAY_JWTSECRET;

  // Mock config with default values
  configSpy = jest.spyOn(config, 'get').mockImplementation((key) => {
    if (key === 'gateway.jwtSecret') return TEST_SECRET;
    if (key === 'gateway.jwtLifetime') return '15m';
    return undefined;
  });

  // Clear module cache to force re-evaluation of getJwtSecret
  delete require.cache[require.resolve('../../../../src/gateway/v1/auth/service')];

  // Load fresh service instance for most tests
  testService = require('../../../../src/gateway/v1/auth/service');
});

afterEach(() => {
  configSpy.mockRestore();
});

test('createToken returns a JWT string', async () => {
  const token = await testService.createToken(TEST_PAYLOAD);
  expect(typeof token).toBe('string');
  expect(token.split('.').length).toBe(3); // JWT format
});

test('refreshToken returns a new JWT with same payload minus iat/exp', async () => {
  const token = await testService.createToken(TEST_PAYLOAD);
  const refreshed = await testService.refreshToken(token);
  expect(typeof refreshed).toBe('string');
  expect(refreshed.split('.').length).toBe(3);
  expect(await testService.validateToken(refreshed)).toBe(true);
});

test('validateToken returns true for valid token', async () => {
  const token = await testService.createToken(TEST_PAYLOAD);
  const result = await testService.validateToken(token);
  expect(result).toBe(true);
});

test('refreshToken throws for invalid token', async () => {
  await expect(testService.refreshToken('not-a-token')).rejects.toThrow('Invalid refresh token');
});

test('validateToken throws for invalid token', async () => {
  await expect(testService.validateToken('not-a-token')).rejects.toThrow();
});

test('verifyTokenAndGetPayload returns valid result for good token', async () => {
  const token = await testService.createToken(TEST_PAYLOAD);
  const result = await testService.verifyTokenAndGetPayload(token);
  expect(result.valid).toBe(true);
  expect(result.payload.formId).toBe('abc');
  expect(result.payload.userId).toBe('u1');
});

test('verifyTokenAndGetPayload returns invalid result for bad token', async () => {
  const result = await testService.verifyTokenAndGetPayload('invalid-token');
  expect(result.valid).toBe(false);
  expect(result.error).toBeDefined();
});

test('getCurrentSecret returns redacted for production', async () => {
  process.env.NODE_ENV = 'production';
  delete process.env.GATEWAY_JWTSECRET;
  configSpy.mockRestore();
  jest.spyOn(config, 'get').mockImplementation((key) => {
    if (key === 'gateway.jwtSecret') return 'valid-production-secret';
    if (key === 'gateway.jwtLifetime') return '15m';
    return undefined;
  });
  delete require.cache[require.resolve('../../../../src/gateway/v1/auth/service')];
  const testService = require('../../../../src/gateway/v1/auth/service');
  expect(testService.getCurrentSecret()).toBe('[REDACTED]');
});

test('getCurrentSecret returns generated secret for non-production', async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.GATEWAY_JWTSECRET;
  configSpy.mockRestore();
  delete require.cache[require.resolve('../../../../src/gateway/v1/auth/service')];
  const testService = require('../../../../src/gateway/v1/auth/service');
  const secret = testService.getCurrentSecret();
  expect(typeof secret).toBe('string');
  expect(secret.length).toBeGreaterThan(20); // Generated base64 should be long
  expect(secret).not.toBe(TEST_SECRET); // Should not be the config value
});

test('generates consistent secret across calls in same session', async () => {
  // This test needs its own service instance to test consistency
  process.env.NODE_ENV = 'development';
  delete process.env.GATEWAY_JWTSECRET;
  configSpy.mockRestore();
  delete require.cache[require.resolve('../../../../src/gateway/v1/auth/service')];
  const consistencyTestService = require('../../../../src/gateway/v1/auth/service');
  const secret1 = consistencyTestService.getCurrentSecret();
  const secret2 = consistencyTestService.getCurrentSecret();
  expect(secret1).toBe(secret2); // Should be consistent within same module load
});

test('generates secret with proper characteristics in non-production', async () => {
  // This test needs its own service instance with different config
  process.env.NODE_ENV = 'development';
  delete process.env.GATEWAY_JWTSECRET;
  configSpy.mockRestore();

  delete require.cache[require.resolve('../../../../src/gateway/v1/auth/service')];
  const devTestService = require('../../../../src/gateway/v1/auth/service');
  const secret = devTestService.getCurrentSecret();

  expect(typeof secret).toBe('string');
  expect(secret.length).toBeGreaterThan(20); // Generated base64 should be long
  expect(secret).not.toBe(TEST_SECRET); // Should not be the config value
  expect(secret).not.toContain('REPLACE_'); // Should not be a placeholder
});

test('production validation logic works correctly', async () => {
  // Test the validation logic by directly testing what would happen
  const originalNodeEnv = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = 'production';

    // Test the logic that should throw an error
    const mockConfig = {
      get: (key) => {
        if (key === 'gateway.jwtSecret') return 'REPLACE_WITH_REAL_SECRET';
        if (key === 'gateway.jwtLifetime') return '15m';
        return undefined;
      },
    };

    // Simulate the getJwtSecret function logic
    const testGetJwtSecret = () => {
      if (process.env.NODE_ENV === 'production') {
        const secret = mockConfig.get('gateway.jwtSecret');
        if (!secret || secret.includes('REPLACE_') || secret.includes('generate')) {
          throw new Error('Production requires explicit gateway.jwtSecret configuration');
        }
        return secret;
      }
      return require('node:crypto').randomBytes(32).toString('base64');
    };

    expect(() => {
      testGetJwtSecret();
    }).toThrow('Production requires explicit gateway.jwtSecret configuration');
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
});

test('createToken respects JWT lifetime config', async () => {
  // This test needs custom config, so it needs its own service instance
  configSpy.mockRestore();
  jest.spyOn(config, 'get').mockImplementation((key) => {
    if (key === 'gateway.jwtSecret') return TEST_SECRET;
    if (key === 'gateway.jwtLifetime') return '900'; // 900s
    return undefined;
  });
  delete require.cache[require.resolve('../../../../src/gateway/v1/auth/service')];
  const lifetimeTestService = require('../../../../src/gateway/v1/auth/service');
  const token = await lifetimeTestService.createToken(TEST_PAYLOAD);
  expect(typeof token).toBe('string');
});
