/* eslint-env jest */

const gatewayBearerStrategy = require('../../../../../../src/runtime-auth/security/auth/strategies/gatewayBearer');
const ERRORS = require('../../../../../../src/runtime-auth/security/errorMessages');

describe('auth/strategies/gatewayBearer', () => {
  let strategy;
  let mockGatewayService;
  let mockFormService;
  let mockAuthService;

  beforeEach(() => {
    mockGatewayService = {
      verifyTokenAndGetPayload: jest.fn(),
    };
    mockFormService = {
      readApiKey: jest.fn(),
    };
    mockAuthService = {
      readUser: jest.fn(),
    };

    strategy = gatewayBearerStrategy({
      deps: {
        services: {
          gatewayService: mockGatewayService,
          formService: mockFormService,
          authService: mockAuthService,
        },
      },
    });
  });

  it('should have correct name and isPublic flag', () => {
    expect(strategy.name).toBe('gatewayBearer');
    expect(strategy.isPublic).toBe(false);
  });

  it('should have canHandle and authenticate functions', () => {
    expect(typeof strategy.canHandle).toBe('function');
    expect(typeof strategy.authenticate).toBe('function');
  });

  it('should return true for Bearer authorization header', () => {
    const req = { headers: { authorization: 'Bearer token123' } };
    expect(strategy.canHandle(req)).toBe(true);
  });

  it('should return true for bearer authorization header (case insensitive)', () => {
    const req = { headers: { authorization: 'bearer token123' } };
    expect(strategy.canHandle(req)).toBe(true);
  });

  it('should return false for Basic authorization header', () => {
    const req = { headers: { authorization: 'Basic dGVzdDp0ZXN0' } };
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
    id: 'gateway-user-id',
    username: 'gateway-user',
    email: 'gateway@example.com',
    fullName: 'Gateway User',
    firstName: 'Gateway',
    lastName: 'User',
    idpCode: 'gateway',
    idpUserId: 'gateway-user',
    keycloakId: 'runtime-auth-gateway-user',
  };

  const mockApiKeyRecord = {
    secret: 'test-secret',
    filesApiAccess: true,
  };

  const mockTokenPayload = {
    formId: 'form123',
    apiKey: 'test-secret',
    otherClaim: 'value',
  };

  beforeEach(() => {
    mockAuthService.readUser.mockResolvedValue(mockUser);
    mockFormService.readApiKey.mockResolvedValue(mockApiKeyRecord);
    mockGatewayService.verifyTokenAndGetPayload.mockResolvedValue({
      valid: true,
      payload: mockTokenPayload,
    });
  });

  it('should authenticate successfully with valid token', async () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' },
      method: 'GET',
      path: '/test',
    };

    const result = await strategy.authenticate(req);

    expect(result).toEqual({
      authType: 'gateway',
      strategyName: 'gatewayBearer',
      actor: {
        type: 'gateway',
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        fullName: mockUser.fullName,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        idpCode: mockUser.idpCode,
        idpUserId: mockUser.idpUserId,
        keycloakId: mockUser.keycloakId,
        formId: 'form123',
        metadata: {
          filesApiAccess: true,
          apiKeyMetadata: {
            filesApiAccess: true,
          },
          ...mockUser,
        },
      },
      claims: mockTokenPayload,
    });

    expect(mockGatewayService.verifyTokenAndGetPayload).toHaveBeenCalledWith('valid-token');
    expect(mockFormService.readApiKey).toHaveBeenCalledWith('form123');
    expect(mockAuthService.readUser).toHaveBeenCalledWith('runtime-auth-gateway-user');
  });

  it('should throw error when no authorization header', async () => {
    const req = {
      headers: {},
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.MISSING_AUTHORIZATION);
  });

  it('should throw error when token verification fails', async () => {
    mockGatewayService.verifyTokenAndGetPayload.mockResolvedValue({
      valid: false,
      error: 'Token expired',
    });

    const req = {
      headers: { authorization: 'Bearer invalid-token' },
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.INVALID_GATEWAY_TOKEN);
  });

  it('should throw error when token payload missing formId', async () => {
    mockGatewayService.verifyTokenAndGetPayload.mockResolvedValue({
      valid: true,
      payload: { apiKey: 'test-secret' }, // Missing formId
    });

    const req = {
      headers: { authorization: 'Bearer token-without-formid' },
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.GATEWAY_TOKEN_MISSING_CLAIMS);
  });

  it('should throw error when form not found', async () => {
    mockFormService.readApiKey.mockResolvedValue(null);

    const req = {
      headers: { authorization: 'Bearer valid-token' },
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.FORM_OR_API_KEY_NOT_FOUND);
  });

  it('should throw error when API key does not match', async () => {
    mockFormService.readApiKey.mockResolvedValue({
      secret: 'different-secret',
      filesApiAccess: true,
    });

    const req = {
      headers: { authorization: 'Bearer valid-token' },
      method: 'GET',
      path: '/test',
    };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.INVALID_CREDENTIALS);
  });

  it('should throw error when user not found in database', async () => {
    mockAuthService.readUser.mockRejectedValue(new Error('User not found'));

    const req = {
      headers: { authorization: 'Bearer valid-token' },
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
      headers: { authorization: 'Bearer valid-token' },
      method: 'GET',
      path: '/test',
    };

    const result = await strategy.authenticate(req);

    expect(result.actor.metadata.filesApiAccess).toBe(false);
    expect(result.actor.metadata.apiKeyMetadata.filesApiAccess).toBe(false);
  });

  it('should trim token from authorization header', async () => {
    const req = {
      headers: { authorization: 'Bearer  token123  ' },
      method: 'GET',
      path: '/test',
    };

    await strategy.authenticate(req);

    expect(mockGatewayService.verifyTokenAndGetPayload).toHaveBeenCalledWith('token123');
  });
});
