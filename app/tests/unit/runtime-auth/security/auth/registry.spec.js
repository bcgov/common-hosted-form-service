/* eslint-env jest */

const makeAuthRegistry = require('../../../../../src/runtime-auth/security/auth/registry');

describe('auth/registry', () => {
  let authRegistry;
  let mockStrategies;

  beforeEach(() => {
    mockStrategies = [
      {
        name: 'userOidc',
        isPublic: false,
        canHandle: jest.fn(),
        authenticate: jest.fn(),
      },
      {
        name: 'apiKeyBasic',
        isPublic: false,
        canHandle: jest.fn(),
        authenticate: jest.fn(),
      },
      {
        name: 'public',
        isPublic: true,
        canHandle: jest.fn(),
        authenticate: jest.fn(),
      },
    ];

    authRegistry = makeAuthRegistry({ strategies: mockStrategies });
  });

  it('should return non-public strategies when allowedAuth is empty', () => {
    const result = authRegistry.resolveAllowed([]);
    expect(result).toEqual(['userOidc', 'apiKeyBasic']);
  });

  it('should return non-public strategies when allowedAuth is undefined', () => {
    const result = authRegistry.resolveAllowed(undefined);
    expect(result).toEqual(['userOidc', 'apiKeyBasic']);
  });

  it('should return non-public strategies when allowedAuth is null', () => {
    const result = authRegistry.resolveAllowed(null);
    expect(result).toEqual(['userOidc', 'apiKeyBasic']);
  });

  it('should return specified allowedAuth when provided', () => {
    const result = authRegistry.resolveAllowed(['userOidc', 'public']);
    expect(result).toEqual(['userOidc', 'public']);
  });

  it('should return single strategy when only one specified', () => {
    const result = authRegistry.resolveAllowed(['apiKeyBasic']);
    expect(result).toEqual(['apiKeyBasic']);
  });

  let mockReq;
  let mockDeps;
  let mockPolicy;

  beforeEach(() => {
    mockReq = { headers: { authorization: 'Bearer token' } };
    mockDeps = { services: {} };
    mockPolicy = { pattern: '/test' };
  });

  it('should return result from first successful strategy', async () => {
    const mockResult = {
      authType: 'user',
      actor: { id: 'user-1', type: 'user' },
      claims: { sub: 'user-1' },
    };

    mockStrategies[0].canHandle.mockReturnValue(true);
    mockStrategies[0].authenticate.mockResolvedValue(mockResult);

    const result = await authRegistry.authenticate(['userOidc'], mockReq, mockDeps, mockPolicy);

    expect(result).toBe(mockResult);
    expect(mockStrategies[0].canHandle).toHaveBeenCalledWith(mockReq);
    expect(mockStrategies[0].authenticate).toHaveBeenCalledWith(mockReq, mockDeps, mockPolicy);
  });

  it('should try next strategy when first fails with 401', async () => {
    const mockResult = {
      authType: 'apiKey',
      actor: { id: 'api-1', type: 'apiKey' },
      claims: { formId: 'form1' },
    };

    mockStrategies[0].canHandle.mockReturnValue(true);
    mockStrategies[0].authenticate.mockRejectedValue({ status: 401, message: 'Invalid token' });

    mockStrategies[1].canHandle.mockReturnValue(true);
    mockStrategies[1].authenticate.mockResolvedValue(mockResult);

    const result = await authRegistry.authenticate(['userOidc', 'apiKeyBasic'], mockReq, mockDeps, mockPolicy);

    expect(result).toBe(mockResult);
    expect(mockStrategies[0].authenticate).toHaveBeenCalled();
    expect(mockStrategies[1].authenticate).toHaveBeenCalled();
  });

  it('should throw error when all strategies fail', async () => {
    mockStrategies[0].canHandle.mockReturnValue(true);
    mockStrategies[0].authenticate.mockRejectedValue({ status: 401, message: 'Invalid token' });

    mockStrategies[1].canHandle.mockReturnValue(true);
    mockStrategies[1].authenticate.mockRejectedValue({ status: 401, message: 'Invalid credentials' });

    await expect(authRegistry.authenticate(['userOidc', 'apiKeyBasic'], mockReq, mockDeps, mockPolicy)).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    });
  });

  it('should throw non-401 errors immediately', async () => {
    const non401Error = new Error('Database error');
    non401Error.status = 500;

    mockStrategies[0].canHandle.mockReturnValue(true);
    mockStrategies[0].authenticate.mockRejectedValue(non401Error);

    await expect(authRegistry.authenticate(['userOidc'], mockReq, mockDeps, mockPolicy)).rejects.toThrow('Database error');
  });

  it('should skip strategies that cannot handle request', async () => {
    const mockResult = {
      authType: 'apiKey',
      actor: { id: 'api-1', type: 'apiKey' },
      claims: { formId: 'form1' },
    };

    mockStrategies[0].canHandle.mockReturnValue(false);
    mockStrategies[1].canHandle.mockReturnValue(true);
    mockStrategies[1].authenticate.mockResolvedValue(mockResult);

    const result = await authRegistry.authenticate(['userOidc', 'apiKeyBasic'], mockReq, mockDeps, mockPolicy);

    expect(result).toBe(mockResult);
    expect(mockStrategies[0].authenticate).not.toHaveBeenCalled();
    expect(mockStrategies[1].authenticate).toHaveBeenCalled();
  });

  it('should handle missing strategies gracefully', async () => {
    const strategiesWithMissing = [
      { name: 'userOidc', isPublic: false, canHandle: jest.fn(), authenticate: jest.fn() },
      { name: 'missingStrategy', isPublic: false, canHandle: jest.fn(), authenticate: jest.fn() },
    ];

    const registryWithMissing = makeAuthRegistry({ strategies: strategiesWithMissing });

    strategiesWithMissing[0].canHandle.mockReturnValue(true);
    strategiesWithMissing[0].authenticate.mockResolvedValue({
      authType: 'user',
      actor: { id: 'user-1', type: 'user' },
    });

    const result = await registryWithMissing.authenticate(['userOidc', 'missingStrategy'], mockReq, mockDeps, mockPolicy);

    expect(result.authType).toBe('user');
  });

  it('should use last error message when all strategies fail', async () => {
    mockStrategies[0].canHandle.mockReturnValue(true);
    mockStrategies[0].authenticate.mockRejectedValue({ status: 401, message: 'First error' });

    mockStrategies[1].canHandle.mockReturnValue(true);
    mockStrategies[1].authenticate.mockRejectedValue({ status: 401, message: 'Last error' });

    await expect(authRegistry.authenticate(['userOidc', 'apiKeyBasic'], mockReq, mockDeps, mockPolicy)).rejects.toMatchObject({
      message: 'Last error',
      status: 401,
    });
  });
});
