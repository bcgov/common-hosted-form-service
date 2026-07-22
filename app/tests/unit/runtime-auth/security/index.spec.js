/* eslint-env jest */

// Mock all dependencies to prevent actual module loading
jest.mock('../../../../src/runtime-auth/security/orchestrator', () => jest.fn(() => ({ middleware: jest.fn() })));
jest.mock('../../../../src/runtime-auth/security/auth/registry', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/auth/strategies', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/policy/centralized', () => ({
  createCentralizedMatcher: jest.fn(() => jest.fn()),
}));
jest.mock('../../../../src/runtime-auth/security/resource/resolve', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/rbac/enrich', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/inline', () => jest.fn(() => jest.fn()));
jest.mock('../../../../src/runtime-auth/security/middleware/requirePermissions', () => jest.fn(() => jest.fn()));
jest.mock('../../../../src/runtime-auth/security/middleware/filePermissions', () => ({
  hasFileCreate: jest.fn(() => jest.fn()),
  hasFilePermissions: jest.fn(() => jest.fn()),
}));
jest.mock('../../../../src/runtime-auth/security/chefsSecurity', () => ({
  makeCHEFSSecurity: jest.fn(() => ({ withPolicies: jest.fn(), inline: jest.fn() })),
  createCHEFSSecurity: jest.fn(() => ({ withPolicies: jest.fn(), inline: jest.fn() })),
}));
jest.mock('../../../../src/runtime-auth/security/auth/types', () => ({
  AuthTypes: { USER: 'user', PUBLIC: 'public', API_KEY: 'apiKey' },
  AuthCombinations: { PUBLIC_ONLY: ['public'], USER_ONLY: ['userOidc'] },
}));

const securityIndex = require('../../../../src/runtime-auth/security/index');

describe('runtime-auth/security/index', () => {
  let mockDeps;
  let mockStrategies;
  let mockAuthRegistry;
  let mockResolver;
  let mockEnrichRBAC;
  let mockPolicyStore;
  let mockOrchestrator;
  let mockSecure;
  let mockRequirePermissions;
  let mockFilePermissions;
  let mockCHEFSSecurity;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDeps = {
      logger: jest.fn(),
      services: {
        jwtService: jest.fn(),
        authService: jest.fn(),
        formService: jest.fn(),
      },
      baseUrl: 'https://test.com',
    };

    mockStrategies = jest.fn();
    mockAuthRegistry = jest.fn();
    mockResolver = jest.fn();
    mockEnrichRBAC = jest.fn();
    mockPolicyStore = jest.fn();
    mockOrchestrator = { middleware: jest.fn() };
    mockSecure = jest.fn();
    mockRequirePermissions = jest.fn();
    mockFilePermissions = {
      hasFileCreate: jest.fn(),
      hasFilePermissions: jest.fn(),
    };
    mockCHEFSSecurity = {
      makeCHEFSSecurity: jest.fn(),
      createCHEFSSecurity: jest.fn(),
    };

    const mockOrchestratorFn = require('../../../../src/runtime-auth/security/orchestrator');
    const mockAuthRegistryFn = require('../../../../src/runtime-auth/security/auth/registry');
    const mockAuthStrategiesFn = require('../../../../src/runtime-auth/security/auth/strategies');
    const mockCentralized = require('../../../../src/runtime-auth/security/policy/centralized');
    const mockResourceResolverFn = require('../../../../src/runtime-auth/security/resource/resolve');
    const mockEnrichRBACFn = require('../../../../src/runtime-auth/security/rbac/enrich');
    const mockSecureFn = require('../../../../src/runtime-auth/security/inline');
    const mockRequirePermissionsFn = require('../../../../src/runtime-auth/security/middleware/requirePermissions');
    const mockFilePermissionsModule = require('../../../../src/runtime-auth/security/middleware/filePermissions');
    const mockCHEFSSecurityModule = require('../../../../src/runtime-auth/security/chefsSecurity');

    mockOrchestratorFn.mockReturnValue(mockOrchestrator);
    mockAuthRegistryFn.mockReturnValue(mockAuthRegistry);
    mockAuthStrategiesFn.mockReturnValue(mockStrategies);
    mockCentralized.createCentralizedMatcher.mockReturnValue(mockPolicyStore);
    mockResourceResolverFn.mockReturnValue(mockResolver);
    mockEnrichRBACFn.mockReturnValue(mockEnrichRBAC);
    mockSecureFn.mockReturnValue(mockSecure);
    mockRequirePermissionsFn.mockReturnValue(mockRequirePermissions);
    mockFilePermissionsModule.hasFileCreate = mockFilePermissions.hasFileCreate;
    mockFilePermissionsModule.hasFilePermissions = mockFilePermissions.hasFilePermissions;
    mockCHEFSSecurityModule.makeCHEFSSecurity = mockCHEFSSecurity.makeCHEFSSecurity;
    mockCHEFSSecurityModule.createCHEFSSecurity = mockCHEFSSecurity.createCHEFSSecurity;
  });

  it('should export all expected functions and constants', () => {
    expect(securityIndex).toHaveProperty('buildSecurity');
    expect(securityIndex).toHaveProperty('secure');
    expect(securityIndex).toHaveProperty('requirePermissions');
    expect(securityIndex).toHaveProperty('hasFileCreate');
    expect(securityIndex).toHaveProperty('hasFilePermissions');
    expect(securityIndex).toHaveProperty('makeCHEFSSecurity');
    expect(securityIndex).toHaveProperty('createCHEFSSecurity');
    expect(securityIndex).toHaveProperty('AuthTypes');
    expect(securityIndex).toHaveProperty('AuthCombinations');
  });

  it('should export functions with correct types', () => {
    expect(typeof securityIndex.buildSecurity).toBe('function');
    expect(typeof securityIndex.secure).toBe('function');
    expect(typeof securityIndex.requirePermissions).toBe('function');
    expect(typeof securityIndex.hasFileCreate).toBe('function');
    expect(typeof securityIndex.hasFilePermissions).toBe('function');
    expect(typeof securityIndex.makeCHEFSSecurity).toBe('function');
    expect(typeof securityIndex.createCHEFSSecurity).toBe('function');
  });

  it('should export AuthTypes constants', () => {
    expect(securityIndex.AuthTypes).toEqual({
      USER: 'user',
      PUBLIC: 'public',
      API_KEY: 'apiKey',
    });
  });

  it('should export AuthCombinations constants', () => {
    expect(securityIndex.AuthCombinations).toEqual({
      PUBLIC_ONLY: ['public'],
      USER_ONLY: ['userOidc'],
    });
  });

  describe('buildSecurity', () => {
    it('should return middleware function', () => {
      const middleware = securityIndex.buildSecurity(mockDeps);

      expect(typeof middleware).toBe('function');
    });

    it('should call all required factory functions', () => {
      securityIndex.buildSecurity(mockDeps);

      const mockAuthStrategiesFn = require('../../../../src/runtime-auth/security/auth/strategies');
      const mockAuthRegistryFn = require('../../../../src/runtime-auth/security/auth/registry');
      const mockResourceResolverFn = require('../../../../src/runtime-auth/security/resource/resolve');
      const mockEnrichRBACFn = require('../../../../src/runtime-auth/security/rbac/enrich');
      const mockCentralized = require('../../../../src/runtime-auth/security/policy/centralized');
      const mockOrchestratorFn = require('../../../../src/runtime-auth/security/orchestrator');

      expect(mockAuthStrategiesFn).toHaveBeenCalledWith(mockDeps);
      expect(mockAuthRegistryFn).toHaveBeenCalledWith({ strategies: mockStrategies, deps: mockDeps });
      expect(mockResourceResolverFn).toHaveBeenCalledWith({ deps: mockDeps });
      expect(mockEnrichRBACFn).toHaveBeenCalledWith({ deps: mockDeps });
      expect(mockCentralized.createCentralizedMatcher).toHaveBeenCalledWith([]);
      expect(mockOrchestratorFn).toHaveBeenCalledWith({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });
    });

    it('should work with custom policies', () => {
      const customPolicies = [
        { method: 'GET', pattern: '/test', allowedAuth: ['public'] },
        { method: 'POST', pattern: '/secure', allowedAuth: ['userOidc'] },
      ];

      securityIndex.buildSecurity(mockDeps, customPolicies);

      const mockCentralized = require('../../../../src/runtime-auth/security/policy/centralized');
      expect(mockCentralized.createCentralizedMatcher).toHaveBeenCalledWith(customPolicies);
    });

    it('should work with empty policies array', () => {
      securityIndex.buildSecurity(mockDeps, []);

      const mockCentralized = require('../../../../src/runtime-auth/security/policy/centralized');
      expect(mockCentralized.createCentralizedMatcher).toHaveBeenCalledWith([]);
    });

    it('should work with minimal deps', () => {
      const minimalDeps = { services: {} };
      const middleware = securityIndex.buildSecurity(minimalDeps);

      expect(typeof middleware).toBe('function');
    });
  });

  describe('secure', () => {
    it('should return middleware function', () => {
      const middleware = securityIndex.secure({ allowedAuth: ['public'] });

      expect(typeof middleware).toBe('function');
    });

    it('should call inline secure function', () => {
      const spec = { allowedAuth: ['userOidc'], requiredPermissions: ['FORM_READ'] };
      securityIndex.secure(spec);

      const mockSecureFn = require('../../../../src/runtime-auth/security/inline');
      expect(mockSecureFn).toHaveBeenCalledWith(spec);
    });
  });

  describe('requirePermissions', () => {
    it('should return middleware function', () => {
      const middleware = securityIndex.requirePermissions(['FORM_READ']);

      expect(typeof middleware).toBe('function');
    });

    it('should call requirePermissions middleware', () => {
      const permissions = ['FORM_READ', 'FORM_UPDATE'];
      securityIndex.requirePermissions(permissions);

      const mockRequirePermissionsFn = require('../../../../src/runtime-auth/security/middleware/requirePermissions');
      expect(mockRequirePermissionsFn).toHaveBeenCalledWith(permissions);
    });
  });

  describe('hasFileCreate', () => {
    it('should return middleware function', () => {
      const middleware = securityIndex.hasFileCreate();

      expect(typeof middleware).toBe('function');
    });

    it('should be a function', () => {
      expect(typeof securityIndex.hasFileCreate).toBe('function');
    });
  });

  describe('hasFilePermissions', () => {
    it('should return middleware function', () => {
      const middleware = securityIndex.hasFilePermissions();

      expect(typeof middleware).toBe('function');
    });

    it('should be a function', () => {
      expect(typeof securityIndex.hasFilePermissions).toBe('function');
    });
  });

  describe('makeCHEFSSecurity', () => {
    it('should return CHEFS security instance', () => {
      const result = securityIndex.makeCHEFSSecurity({ baseUrl: 'https://test.com' });

      expect(result).toHaveProperty('withPolicies');
      expect(result).toHaveProperty('inline');
      expect(typeof result.withPolicies).toBe('function');
      expect(typeof result.inline).toBe('function');
    });

    it('should be a function', () => {
      expect(typeof securityIndex.makeCHEFSSecurity).toBe('function');
    });
  });

  describe('createCHEFSSecurity', () => {
    it('should return CHEFS security singleton', () => {
      const result = securityIndex.createCHEFSSecurity({ baseUrl: 'https://test.com' });

      expect(result).toHaveProperty('withPolicies');
      expect(result).toHaveProperty('inline');
      expect(typeof result.withPolicies).toBe('function');
      expect(typeof result.inline).toBe('function');
    });

    it('should be a function', () => {
      expect(typeof securityIndex.createCHEFSSecurity).toBe('function');
    });
  });

  describe('integration', () => {
    it('should allow chaining multiple security functions', () => {
      const middleware1 = securityIndex.buildSecurity(mockDeps);
      const middleware2 = securityIndex.secure({ allowedAuth: ['public'] });
      const middleware3 = securityIndex.requirePermissions(['FORM_READ']);
      const middleware4 = securityIndex.hasFileCreate();

      expect(typeof middleware1).toBe('function');
      expect(typeof middleware2).toBe('function');
      expect(typeof middleware3).toBe('function');
      expect(typeof middleware4).toBe('function');
    });

    it('should work with all exported constants', () => {
      expect(securityIndex.AuthTypes.USER).toBe('user');
      expect(securityIndex.AuthTypes.PUBLIC).toBe('public');
      expect(securityIndex.AuthTypes.API_KEY).toBe('apiKey');
      expect(securityIndex.AuthCombinations.PUBLIC_ONLY).toEqual(['public']);
      expect(securityIndex.AuthCombinations.USER_ONLY).toEqual(['userOidc']);
    });

    it('should maintain consistent interface across all exports', () => {
      // All middleware functions should return functions
      const middlewares = [
        securityIndex.buildSecurity(mockDeps),
        securityIndex.secure({ allowedAuth: ['public'] }),
        securityIndex.requirePermissions(['FORM_READ']),
        securityIndex.hasFileCreate(),
        securityIndex.hasFilePermissions(),
      ];

      for (const middleware of middlewares) {
        expect(typeof middleware).toBe('function');
      }
    });
  });
});
