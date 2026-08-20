/* eslint-env jest */

const apiKeyBasicStrategy = require('../../../../../../src/runtime-auth/security/auth/strategies/apiKeyBasic');
const ERRORS = require('../../../../../../src/runtime-auth/security/errorMessages');

/**
 * Helper function to create Basic auth header dynamically
 * Generates base64(formId:apiKey) at runtime to avoid hardcoded secrets
 */
function createBasicAuthHeader(formId, apiKey) {
  const credentials = `${formId}:${apiKey}`;
  const base64 = Buffer.from(credentials).toString('base64');
  return `Basic ${base64}`;
}

describe('auth/strategies/apiKeyBasic', () => {
  let strategy;
  let mockFormService;
  let mockAuthService;

  beforeEach(() => {
    mockFormService = {
      readApiKey: jest.fn(),
    };
    mockAuthService = {
      readUser: jest.fn(),
    };

    strategy = apiKeyBasicStrategy({
      deps: {
        services: {
          formService: mockFormService,
          authService: mockAuthService,
        },
      },
    });
  });

  it('should have correct name and isPublic flag', () => {
    expect(strategy.name).toBe('apiKeyBasic');
    expect(strategy.isPublic).toBe(false);
  });

  it('should have canHandle and authenticate functions', () => {
    expect(typeof strategy.canHandle).toBe('function');
    expect(typeof strategy.authenticate).toBe('function');
  });

  it('should return true for Basic authorization header', () => {
    const req = { headers: { authorization: createBasicAuthHeader('test', 'test') } };
    expect(strategy.canHandle(req)).toBe(true);
  });

  it('should return true for basic authorization header (case insensitive)', () => {
    const req = { headers: { authorization: createBasicAuthHeader('test', 'test').toLowerCase() } };
    expect(strategy.canHandle(req)).toBe(true);
  });

  it('should return false for Bearer authorization header', () => {
    const req = { headers: { authorization: 'Bearer token' } };
    expect(strategy.canHandle(req)).toBe(false);
  });

  it('should return false when no authorization header', () => {
    const req = { headers: {} };
    expect(strategy.canHandle(req)).toBe(false);
  });

  it('should return false for invalid authorization format', () => {
    const req = { headers: { authorization: 'Invalid format' } };
    expect(strategy.canHandle(req)).toBe(false);
  });

  const mockUser = {
    id: 'api-user-id',
    username: 'api-user',
    email: 'api@example.com',
    fullName: 'API User',
    firstName: 'API',
    lastName: 'User',
    idpCode: 'api',
    idpUserId: 'api-user',
    keycloakId: 'runtime-auth-api-user',
  };

  const mockApiKeyRecord = {
    secret: 'test-secret',
    filesApiAccess: true,
  };

  beforeEach(() => {
    mockAuthService.readUser.mockResolvedValue(mockUser);
    mockFormService.readApiKey.mockResolvedValue(mockApiKeyRecord);
  });

  it('should authenticate successfully with valid credentials', async () => {
    const req = {
      headers: { authorization: createBasicAuthHeader('form1', 'test-secret') },
      method: 'GET',
      path: '/test',
    };

    const result = await strategy.authenticate(req);

    expect(result).toEqual({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actor: {
        type: 'apiKey',
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        fullName: mockUser.fullName,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        idpCode: mockUser.idpCode,
        idpUserId: mockUser.idpUserId,
        keycloakId: mockUser.keycloakId,
        formId: 'form1',
        metadata: {
          filesApiAccess: true,
          apiKeyMetadata: {
            filesApiAccess: true,
          },
          ...mockUser,
        },
      },
      claims: { formId: 'form1' },
    });

    expect(mockFormService.readApiKey).toHaveBeenCalledWith('form1');
    expect(mockAuthService.readUser).toHaveBeenCalledWith('runtime-auth-api-user');
  });

  it('should throw error for invalid Basic auth format', async () => {
    const req = {
      headers: { authorization: 'Basic invalid-format' },
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.INVALID_BASIC_FORMAT);
  });

  it('should throw error when form not found', async () => {
    mockFormService.readApiKey.mockResolvedValue(null);

    const req = {
      headers: { authorization: createBasicAuthHeader('form1', 'test-secret') },
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.FORM_OR_API_KEY_NOT_FOUND);
  });

  it('should throw error when API key does not match', async () => {
    const req = {
      headers: { authorization: createBasicAuthHeader('form1', 'wrong-secret') },
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.INVALID_CREDENTIALS);
  });

  it('should throw error when user not found in database', async () => {
    mockAuthService.readUser.mockRejectedValue(new Error('User not found'));

    const req = {
      headers: { authorization: createBasicAuthHeader('form1', 'test-secret') },
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow('User not found');
  });

  it('should handle filesApiAccess false', async () => {
    mockFormService.readApiKey.mockResolvedValue({
      secret: 'test-secret',
      filesApiAccess: false,
    });

    const req = {
      headers: { authorization: createBasicAuthHeader('form1', 'test-secret') },
      method: 'GET',
      path: '/test',
    };

    const result = await strategy.authenticate(req);

    expect(result.actor.metadata.filesApiAccess).toBe(false);
    expect(result.actor.metadata.apiKeyMetadata.filesApiAccess).toBe(false);
  });

  it('should handle missing authorization header', async () => {
    const req = {
      headers: {},
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.INVALID_BASIC_FORMAT);
  });
});
