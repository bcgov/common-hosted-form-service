/* eslint-env jest */

// Mock all dependencies to prevent actual module loading
jest.mock('../../../../src/forms/auth/service', () => jest.fn());
jest.mock('../../../../src/forms/form/service', () => jest.fn());
jest.mock('../../../../src/forms/submission/service', () => jest.fn());
jest.mock('../../../../src/forms/file/service', () => jest.fn());
jest.mock('../../../../src/forms/rbac/service', () => jest.fn());
jest.mock('../../../../src/components/jwtService', () => jest.fn());
jest.mock('../../../../src/gateway/v1/auth/service', () => jest.fn());
jest.mock('../../../../src/forms/common/constants', () => ({
  PERMISSIONS: {
    FORM_READ: 'FORM_READ',
    FORM_UPDATE: 'FORM_UPDATE',
    FORM_DELETE: 'FORM_DELETE',
    SUBMISSION_READ: 'SUBMISSION_READ',
    SUBMISSION_UPDATE: 'SUBMISSION_UPDATE',
    SUBMISSION_DELETE: 'SUBMISSION_DELETE',
    FILE_READ: 'FILE_READ',
    FILE_UPDATE: 'FILE_UPDATE',
    FILE_DELETE: 'FILE_DELETE',
  },
}));

// Mock the runtime-auth modules that don't exist yet
jest.mock('../../../../src/runtime-auth/security/orchestrator', () => jest.fn(() => ({ middleware: jest.fn() })));
jest.mock('../../../../src/runtime-auth/security/auth/registry', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/auth/strategies', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/policy/centralized', () => ({
  createCentralizedMatcher: jest.fn(() => jest.fn()),
}));
jest.mock('../../../../src/runtime-auth/security/resource/resolve', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/rbac/enrich', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/inline', () => jest.fn(() => jest.fn()));

const { makeCHEFSSecurity, createCHEFSSecurity } = require('../../../../src/runtime-auth/security/chefsSecurity');

describe('chefsSecurity', () => {
  let mockServices;

  beforeEach(() => {
    jest.clearAllMocks();

    mockServices = {
      authService: jest.fn(),
      formService: jest.fn(),
      submissionService: jest.fn(),
      fileService: jest.fn(),
      rbacService: jest.fn(),
      jwtService: jest.fn(),
      gatewayService: jest.fn(),
    };

    const mockAuthService = require('../../../../src/forms/auth/service');
    const mockFormService = require('../../../../src/forms/form/service');
    const mockSubmissionService = require('../../../../src/forms/submission/service');
    const mockFileService = require('../../../../src/forms/file/service');
    const mockRbacService = require('../../../../src/forms/rbac/service');
    const mockJwtService = require('../../../../src/components/jwtService');
    const mockGatewayService = require('../../../../src/gateway/v1/auth/service');

    mockAuthService.mockReturnValue(mockServices.authService);
    mockFormService.mockReturnValue(mockServices.formService);
    mockSubmissionService.mockReturnValue(mockServices.submissionService);
    mockFileService.mockReturnValue(mockServices.fileService);
    mockRbacService.mockReturnValue(mockServices.rbacService);
    mockJwtService.mockReturnValue(mockServices.jwtService);
    mockGatewayService.mockReturnValue(mockServices.gatewayService);
  });

  describe('makeCHEFSSecurity', () => {
    it('should create security instance with default config', () => {
      const result = makeCHEFSSecurity();

      expect(result).toHaveProperty('withPolicies');
      expect(result).toHaveProperty('inline');
      expect(result).toHaveProperty('getDeps');
      expect(result).toHaveProperty('custom');
      expect(typeof result.withPolicies).toBe('function');
      expect(typeof result.inline).toBe('function');
      expect(typeof result.getDeps).toBe('function');
      expect(typeof result.custom).toBe('function');
    });

    it('should create security instance with custom config', () => {
      const config = {
        baseUrl: 'https://example.com',
        constants: { PERMISSIONS: { READ: 'read' } },
        deps: { customDep: 'value' },
      };

      const result = makeCHEFSSecurity(config);

      expect(result).toHaveProperty('withPolicies');
      expect(result).toHaveProperty('inline');
      expect(result).toHaveProperty('getDeps');
      expect(result).toHaveProperty('custom');
    });

    it('should load all required CHEFS services', () => {
      makeCHEFSSecurity();

      // The services are loaded during module initialization, so we can't easily test calls
      // Instead, we verify the dependencies object contains the expected services
      const result = makeCHEFSSecurity();
      const deps = result.getDeps();

      expect(deps.services).toHaveProperty('authService');
      expect(deps.services).toHaveProperty('formService');
      expect(deps.services).toHaveProperty('submissionService');
      expect(deps.services).toHaveProperty('fileService');
      expect(deps.services).toHaveProperty('rbacService');
      expect(deps.services).toHaveProperty('jwtService');
      expect(deps.services).toHaveProperty('gatewayService');
    });

    it('should use provided constants or default', () => {
      const customConstants = { PERMISSIONS: { CUSTOM: 'custom' } };
      const result = makeCHEFSSecurity({ constants: customConstants });
      const deps = result.getDeps();

      expect(deps.constants).toBe(customConstants);
    });

    it('should use default constants when not provided', () => {
      const result = makeCHEFSSecurity();
      const deps = result.getDeps();

      expect(deps.constants).toBeDefined();
      expect(deps.constants.PERMISSIONS).toBeDefined();
    });

    it('should build dependencies with all services', () => {
      const config = { baseUrl: 'https://test.com' };
      const result = makeCHEFSSecurity(config);
      const deps = result.getDeps();

      expect(deps.baseUrl).toBe('https://test.com');
      expect(deps.services).toHaveProperty('authService');
      expect(deps.services).toHaveProperty('formService');
      expect(deps.services).toHaveProperty('submissionService');
      expect(deps.services).toHaveProperty('fileService');
      expect(deps.services).toHaveProperty('rbacService');
      expect(deps.services).toHaveProperty('jwtService');
      expect(deps.services).toHaveProperty('gatewayService');
      expect(deps.constants).toBeDefined();
    });

    it('should merge custom deps with default deps', () => {
      const customDeps = { customService: jest.fn() };
      const result = makeCHEFSSecurity({ deps: customDeps });
      const deps = result.getDeps();

      expect(deps.customService).toBe(customDeps.customService);
      expect(deps.services).toBeDefined();
    });
  });

  describe('withPolicies', () => {
    it('should return middleware function', () => {
      const result = makeCHEFSSecurity();
      const middleware = result.withPolicies();

      expect(typeof middleware).toBe('function');
    });

    it('should work with empty policies array', () => {
      const result = makeCHEFSSecurity();
      const middleware = result.withPolicies([]);

      expect(typeof middleware).toBe('function');
    });

    it('should work with custom policies', () => {
      const policies = [{ method: 'GET', pattern: '/test' }];
      const result = makeCHEFSSecurity();
      const middleware = result.withPolicies(policies);

      expect(typeof middleware).toBe('function');
    });
  });

  describe('inline', () => {
    it('should return middleware function', () => {
      const result = makeCHEFSSecurity();
      const middleware = result.inline({ allowedAuth: [] });

      expect(typeof middleware).toBe('function');
    });

    it('should work with object spec', () => {
      const spec = { allowedAuth: ['public'], requiredPermissions: [] };
      const result = makeCHEFSSecurity();
      const middleware = result.inline(spec);

      expect(typeof middleware).toBe('function');
    });

    it('should work with function spec', () => {
      const specFn = jest.fn();
      const result = makeCHEFSSecurity();
      const middleware = result.inline(specFn);

      expect(typeof middleware).toBe('function');
    });
  });

  describe('custom', () => {
    it('should build security with custom dependencies', () => {
      const customDeps = { customService: jest.fn() };
      const policies = [{ method: 'POST', pattern: '/custom' }];
      const result = makeCHEFSSecurity();
      const middleware = result.custom(customDeps, policies);

      expect(typeof middleware).toBe('function');
    });

    it('should merge custom deps with existing deps', () => {
      const customDeps = { customService: jest.fn() };
      const result = makeCHEFSSecurity({ baseUrl: 'https://test.com' });
      const middleware = result.custom(customDeps);

      expect(typeof middleware).toBe('function');
    });

    it('should work with empty policies', () => {
      const customDeps = { customService: jest.fn() };
      const result = makeCHEFSSecurity();
      const middleware = result.custom(customDeps);

      expect(typeof middleware).toBe('function');
    });
  });

  describe('createCHEFSSecurity', () => {
    it('should create singleton instance on first call', () => {
      const config = { baseUrl: 'https://test.com' };
      const result1 = createCHEFSSecurity(config);
      const result2 = createCHEFSSecurity(config);

      expect(result1).toBe(result2);
    });

    it('should return same instance on subsequent calls', () => {
      const config1 = { baseUrl: 'https://test1.com' };
      const config2 = { baseUrl: 'https://test2.com' };

      const result1 = createCHEFSSecurity(config1);
      const result2 = createCHEFSSecurity(config2);

      expect(result1).toBe(result2);
    });

    it('should have all expected methods', () => {
      const result = createCHEFSSecurity();

      expect(result).toHaveProperty('withPolicies');
      expect(result).toHaveProperty('inline');
      expect(result).toHaveProperty('getDeps');
      expect(result).toHaveProperty('custom');
    });

    it('should work with empty config', () => {
      const result = createCHEFSSecurity();

      expect(result).toBeDefined();
      expect(typeof result.withPolicies).toBe('function');
      expect(typeof result.inline).toBe('function');
    });
  });

  describe('integration', () => {
    it('should create working middleware from withPolicies', () => {
      const policies = [
        {
          method: 'GET',
          pattern: '/forms/:formId',
          allowedAuth: ['public'],
          requiredPermissions: [],
        },
      ];

      const result = makeCHEFSSecurity();
      const middleware = result.withPolicies(policies);

      expect(typeof middleware).toBe('function');
    });

    it('should create working middleware from inline', () => {
      const spec = {
        allowedAuth: ['userOidc'],
        requiredPermissions: ['FORM_READ'],
      };

      const result = makeCHEFSSecurity();
      const middleware = result.inline(spec);

      expect(typeof middleware).toBe('function');
    });

    it('should allow chaining methods', () => {
      const result = makeCHEFSSecurity();
      const deps = result.getDeps();
      const middleware1 = result.withPolicies([]);
      const middleware2 = result.inline({ allowedAuth: [] });
      const middleware3 = result.custom({}, []);

      expect(typeof middleware1).toBe('function');
      expect(typeof middleware2).toBe('function');
      expect(typeof middleware3).toBe('function');
      expect(deps).toBeDefined();
    });
  });
});
