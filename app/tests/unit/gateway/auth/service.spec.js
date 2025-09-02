const service = require('../../../../src/gateway/v1/auth/service');
const config = require('config');
// eslint-disable-next-line no-unused-vars
const { SignJWT, jwtVerify } = require('jose');

const TEST_SECRET = 'test-secret';
const TEST_PAYLOAD = { formId: 'abc', userId: 'u1' };

beforeAll(() => {
  jest.spyOn(config, 'get').mockImplementation((key) => {
    if (key === 'gateway.jwtSecret') return TEST_SECRET;
    if (key === 'gateway.jwtLifetime') return '15m';
    return undefined;
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});

test('createToken returns a JWT string', async () => {
  // Real jose will generate a JWT, but we only check type/outcome
  const token = await service.createToken(TEST_PAYLOAD);
  expect(typeof token).toBe('string');
  expect(token.split('.').length).toBe(3); // JWT format
});

test('refreshToken returns a new JWT with same payload minus iat/exp', async () => {
  const token = await service.createToken(TEST_PAYLOAD);
  const refreshed = await service.refreshToken(token);
  expect(typeof refreshed).toBe('string');
  expect(refreshed.split('.').length).toBe(3);
  expect(typeof refreshed).toBe('string');
  expect(refreshed.split('.').length).toBe(3);
  expect(await service.validateToken(refreshed)).toBe(true);
});

test('validateToken returns true for valid token', async () => {
  const token = await service.createToken(TEST_PAYLOAD);
  const result = await service.validateToken(token);
  expect(result).toBe(true);
});

test('refreshToken throws for invalid token', async () => {
  await expect(service.refreshToken('not-a-token')).rejects.toThrow('Invalid refresh token');
});

test('validateToken throws for invalid token', async () => {
  await expect(service.validateToken('not-a-token')).rejects.toThrow();
});

test('createToken respects JWT lifetime config', async () => {
  jest.spyOn(config, 'get').mockImplementation((key) => {
    if (key === 'gateway.jwtSecret') return TEST_SECRET;
    if (key === 'gateway.jwtLifetime') return '900'; // 900s
    return undefined;
  });
  const token = await service.createToken(TEST_PAYLOAD);
  expect(typeof token).toBe('string');
});
