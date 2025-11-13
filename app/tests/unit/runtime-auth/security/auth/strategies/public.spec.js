/* eslint-env jest */

const publicStrategy = require('../../../../../../src/runtime-auth/security/auth/strategies/public');

describe('auth/strategies/public', () => {
  let strategy;
  let mockAuthService;

  beforeEach(() => {
    mockAuthService = {
      readUser: jest.fn(),
    };

    strategy = publicStrategy({
      deps: {
        services: {
          authService: mockAuthService,
        },
      },
    });
  });

  it('should have correct name and isPublic flag', () => {
    expect(strategy.name).toBe('public');
    expect(strategy.isPublic).toBe(true);
  });

  it('should have canHandle and authenticate functions', () => {
    expect(typeof strategy.canHandle).toBe('function');
    expect(typeof strategy.authenticate).toBe('function');
  });

  it('should return true when no authorization header', () => {
    const req = { headers: {} };
    expect(strategy.canHandle(req)).toBe(true);
  });

  it('should return true when authorization header is undefined', () => {
    const req = {};
    expect(strategy.canHandle(req)).toBe(true);
  });

  it('should return false when authorization header exists', () => {
    const req = { headers: { authorization: 'Bearer token' } };
    expect(strategy.canHandle(req)).toBe(false);
  });

  it('should return false when authorization header is empty string', () => {
    const req = { headers: { authorization: '' } };
    expect(strategy.canHandle(req)).toBe(false);
  });

  it('should return public actor when user found in database', async () => {
    const mockUser = {
      id: 'public-user-id',
      username: 'public-user',
      email: 'public@example.com',
      fullName: 'Public User',
      firstName: 'Public',
      lastName: 'User',
      idpCode: 'public',
      idpUserId: 'public-user',
      keycloakId: 'runtime-auth-public-user',
    };

    mockAuthService.readUser.mockResolvedValue(mockUser);

    const result = await strategy.authenticate();

    expect(result).toEqual({
      authType: 'public',
      strategyName: 'public',
      actor: {
        type: 'public',
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        fullName: mockUser.fullName,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        idpCode: mockUser.idpCode,
        idpUserId: mockUser.idpUserId,
        keycloakId: mockUser.keycloakId,
        metadata: mockUser,
      },
      claims: { public: true },
    });

    expect(mockAuthService.readUser).toHaveBeenCalledWith('runtime-auth-public-user');
  });

  it('should throw error when user not found in database', async () => {
    mockAuthService.readUser.mockRejectedValue(new Error('User not found'));

    await expect(strategy.authenticate()).rejects.toThrow('User not found');

    expect(mockAuthService.readUser).toHaveBeenCalledWith('runtime-auth-public-user');
  });

  it('should throw error with 401 status when user not found', async () => {
    mockAuthService.readUser.mockRejectedValue(new Error('User not found'));

    await expect(strategy.authenticate()).rejects.toMatchObject({
      status: 401,
      message: 'User not found',
    });
  });

  it('should preserve original error as cause', async () => {
    const originalError = new Error('Database connection failed');
    mockAuthService.readUser.mockRejectedValue(originalError);

    try {
      await strategy.authenticate();
      throw new Error('Should have thrown');
    } catch (error) {
      expect(error.cause).toBe(originalError);
    }
  });
});
