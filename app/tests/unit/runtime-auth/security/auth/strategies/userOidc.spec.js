/* eslint-env jest */

const userOidcStrategy = require('../../../../../../src/runtime-auth/security/auth/strategies/userOidc');
const ERRORS = require('../../../../../../src/runtime-auth/security/errorMessages');

describe('auth/strategies/userOidc', () => {
  let strategy;
  let mockJwtService;
  let mockAuthService;

  beforeEach(() => {
    mockJwtService = {
      getTokenPayload: jest.fn(),
      getBearerToken: jest.fn(),
    };
    mockAuthService = {
      login: jest.fn(),
    };

    strategy = userOidcStrategy({
      deps: {
        services: {
          jwtService: mockJwtService,
          authService: mockAuthService,
        },
      },
    });
  });

  it('should have correct name and isPublic flag', () => {
    expect(strategy.name).toBe('userOidc');
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

  it('should authenticate successfully with valid token and user', async () => {
    const mockPayload = {
      sub: 'user-123',
      email: 'user@example.com',
      client_roles: ['admin', 'user'],
    };

    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'user@example.com',
      fullName: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      idpCode: 'idir',
      idpUserId: 'idir-user-123',
      keycloakId: 'keycloak-123',
    };

    const mockToken = 'Bearer valid-token';

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue(mockToken);
    mockAuthService.login.mockResolvedValue(mockUser);

    const req = { headers: { authorization: mockToken } };
    const result = await strategy.authenticate(req);

    expect(result).toEqual({
      authType: 'user',
      strategyName: 'userOidc',
      actor: {
        type: 'user',
        subtype: 'idir',
        id: 'user-123',
        username: 'testuser',
        email: 'user@example.com',
        fullName: 'Test User',
        isAdmin: true,
        metadata: {
          ...mockUser,
          firstName: 'Test',
          lastName: 'User',
          idpUserId: 'idir-user-123',
          keycloakId: 'keycloak-123',
          public: false,
          clientRoles: ['admin', 'user'],
        },
      },
      claims: mockPayload,
    });

    expect(mockJwtService.getTokenPayload).toHaveBeenCalledWith(req);
    expect(mockJwtService.getBearerToken).toHaveBeenCalledWith(req);
    expect(mockAuthService.login).toHaveBeenCalledWith(mockToken);
  });

  it('should use usernameIdp when available', async () => {
    const mockPayload = { sub: 'user-123' };
    const mockUser = {
      id: 'user-123',
      usernameIdp: 'idp-username',
      username: 'fallback-username',
      email: 'user@example.com',
      idpCode: 'idir',
    };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.username).toBe('idp-username');
  });

  it('should fallback to email when username not available', async () => {
    const mockPayload = { sub: 'user-123' };
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      idpCode: 'idir',
    };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.username).toBe('user@example.com');
  });

  it('should fallback to user id when username and email not available', async () => {
    const mockPayload = { sub: 'user-123' };
    const mockUser = {
      id: 'user-123',
      idpCode: 'idir',
    };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.username).toBe('user-123');
  });

  it('should use idp when idpCode not available', async () => {
    const mockPayload = { sub: 'user-123' };
    const mockUser = {
      id: 'user-123',
      idp: 'bceid',
      email: 'user@example.com',
    };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.subtype).toBe('bceid');
  });

  it('should set isAdmin to true when client_roles includes admin', async () => {
    const mockPayload = { sub: 'user-123', client_roles: ['admin', 'user'] };
    const mockUser = { id: 'user-123', email: 'user@example.com' };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.isAdmin).toBe(true);
  });

  it('should set isAdmin to false when client_roles does not include admin', async () => {
    const mockPayload = { sub: 'user-123', client_roles: ['user'] };
    const mockUser = { id: 'user-123', email: 'user@example.com' };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.isAdmin).toBe(false);
  });

  it('should set isAdmin to false when client_roles is missing', async () => {
    const mockPayload = { sub: 'user-123' };
    const mockUser = { id: 'user-123', email: 'user@example.com' };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.isAdmin).toBe(false);
  });

  it('should include clientRoles in metadata', async () => {
    const mockPayload = { sub: 'user-123', client_roles: ['admin', 'editor'] };
    const mockUser = { id: 'user-123', email: 'user@example.com' };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.metadata.clientRoles).toEqual(['admin', 'editor']);
  });

  it('should include empty array for clientRoles when missing', async () => {
    const mockPayload = { sub: 'user-123' };
    const mockUser = { id: 'user-123', email: 'user@example.com' };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.metadata.clientRoles).toEqual([]);
  });

  it('should preserve public flag from user', async () => {
    const mockPayload = { sub: 'user-123' };
    const mockUser = { id: 'user-123', email: 'user@example.com', public: true };

    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockResolvedValue(mockUser);

    const result = await strategy.authenticate({ headers: { authorization: 'Bearer token' } });

    expect(result.actor.metadata.public).toBe(true);
  });

  it('should throw error when token payload is null', async () => {
    mockJwtService.getTokenPayload.mockResolvedValue(null);
    mockJwtService.getBearerToken.mockReturnValue('token');

    const req = { headers: { authorization: 'Bearer token' } };

    await expect(strategy.authenticate(req)).rejects.toThrow(ERRORS.MISSING_TOKEN);

    expect(mockJwtService.getTokenPayload).toHaveBeenCalledWith(req);
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should throw error when login fails', async () => {
    const mockPayload = { sub: 'user-123' };
    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockRejectedValue(new Error('Login failed'));

    const req = { headers: { authorization: 'Bearer token' } };

    await expect(strategy.authenticate(req)).rejects.toThrow('Login failed');

    expect(mockJwtService.getTokenPayload).toHaveBeenCalledWith(req);
    expect(mockAuthService.login).toHaveBeenCalledWith('token');
  });

  it('should throw error with 401 status when login fails', async () => {
    const mockPayload = { sub: 'user-123' };
    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockRejectedValue(new Error('Login failed'));

    const req = { headers: { authorization: 'Bearer token' } };

    await expect(strategy.authenticate(req)).rejects.toMatchObject({
      status: 401,
      message: 'Login failed',
    });
  });

  it('should preserve original error as cause', async () => {
    const mockPayload = { sub: 'user-123' };
    const originalError = new Error('Database connection failed');
    mockJwtService.getTokenPayload.mockResolvedValue(mockPayload);
    mockJwtService.getBearerToken.mockReturnValue('token');
    mockAuthService.login.mockRejectedValue(originalError);

    const req = { headers: { authorization: 'Bearer token' } };

    try {
      await strategy.authenticate(req);
      throw new Error('Should have thrown');
    } catch (error) {
      expect(error.cause).toBe(originalError);
    }
  });
});
