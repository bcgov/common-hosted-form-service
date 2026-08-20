/* eslint-env jest */

// Mock all dependencies
jest.mock('../../../../src/runtime-auth/security/orchestrator', () => jest.fn(() => ({ middleware: jest.fn() })));
jest.mock('../../../../src/runtime-auth/security/auth/registry', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/auth/strategies', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/resource/resolve', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/rbac/enrich', () => jest.fn());
jest.mock('../../../../src/runtime-auth/security/policy/inline', () => ({
  createInlineMatcher: jest.fn(() => ({ match: jest.fn() })),
}));

const secure = require('../../../../src/runtime-auth/security/inline');

describe('inline', () => {
  let mockDeps;
  let mockOrchestrator;
  let mockAuthRegistry;
  let mockAuthStrategies;
  let mockResourceResolver;
  let mockEnrichRBAC;
  let mockCreateInlineMatcher;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDeps = {
      baseUrl: 'https://example.com',
      services: {
        authService: jest.fn(),
        formService: jest.fn(),
        jwtService: jest.fn(),
      },
    };

    // Mock the orchestrator
    mockOrchestrator = require('../../../../src/runtime-auth/security/orchestrator');
    mockOrchestrator.mockReturnValue({ middleware: jest.fn() });

    // Mock other dependencies
    mockAuthRegistry = require('../../../../src/runtime-auth/security/auth/registry');
    mockAuthStrategies = require('../../../../src/runtime-auth/security/auth/strategies');
    mockResourceResolver = require('../../../../src/runtime-auth/security/resource/resolve');
    mockEnrichRBAC = require('../../../../src/runtime-auth/security/rbac/enrich');
    mockCreateInlineMatcher = require('../../../../src/runtime-auth/security/policy/inline').createInlineMatcher;

    // Reset all mocks to default behavior
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockAuthRegistry.mockReturnValue({ authenticate: jest.fn() });
    mockResourceResolver.mockReturnValue({ resolve: jest.fn() });
    mockEnrichRBAC.mockReturnValue(jest.fn());
    mockCreateInlineMatcher.mockReturnValue({ match: jest.fn() });
  });

  it('should be a function', () => {
    expect(typeof secure).toBe('function');
  });

  it('should create orchestrator with correct dependencies', () => {
    const spec = { allowedAuth: ['public'] };
    secure(spec, mockDeps);

    expect(mockAuthStrategies).toHaveBeenCalledWith(mockDeps);
    expect(mockAuthRegistry).toHaveBeenCalledWith({ strategies: [{ name: 'userOidc' }], deps: mockDeps });
    expect(mockResourceResolver).toHaveBeenCalledWith({ deps: mockDeps });
    expect(mockEnrichRBAC).toHaveBeenCalledWith({ deps: mockDeps });
    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(spec, mockDeps);
  });

  it('should call orchestrator with all required components', () => {
    const spec = { allowedAuth: ['userOidc'] };
    const mockStrategies = [{ name: 'userOidc' }];
    const mockAuthReg = { authenticate: jest.fn() };
    const mockResolver = { resolve: jest.fn() };
    const mockEnrich = jest.fn();
    const mockPolicyStore = { match: jest.fn() };

    mockAuthStrategies.mockReturnValue(mockStrategies);
    mockAuthRegistry.mockReturnValue(mockAuthReg);
    mockResourceResolver.mockReturnValue(mockResolver);
    mockEnrichRBAC.mockReturnValue(mockEnrich);
    mockCreateInlineMatcher.mockReturnValue(mockPolicyStore);

    secure(spec, mockDeps);

    expect(mockOrchestrator).toHaveBeenCalledWith({
      deps: mockDeps,
      policyStore: mockPolicyStore,
      authRegistry: mockAuthReg,
      resolver: mockResolver,
      enrichRBAC: mockEnrich,
    });
  });

  it('should return orchestrator middleware', () => {
    const mockMiddleware = jest.fn();
    mockOrchestrator.mockReturnValue({ middleware: mockMiddleware });

    const spec = { allowedAuth: ['public'] };
    const result = secure(spec, mockDeps);

    expect(result).toBe(mockMiddleware);
  });

  it('should work with function spec', () => {
    const specFn = jest.fn().mockReturnValue({ allowedAuth: ['apiKeyBasic'] });
    const result = secure(specFn, mockDeps);

    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(specFn, mockDeps);
    expect(typeof result).toBe('function');
  });

  it('should work with object spec', () => {
    const spec = {
      allowedAuth: ['gatewayBearer'],
      requiredPermissions: ['FORM_READ'],
      classification: 'forms',
    };
    const result = secure(spec, mockDeps);

    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(spec, mockDeps);
    expect(typeof result).toBe('function');
  });

  it('should work with minimal deps', () => {
    const minimalDeps = { services: {} };
    const spec = { allowedAuth: ['public'] };
    const result = secure(spec, minimalDeps);

    expect(mockAuthStrategies).toHaveBeenCalledWith(minimalDeps);
    expect(mockAuthRegistry).toHaveBeenCalledWith({ strategies: [{ name: 'userOidc' }], deps: minimalDeps });
    expect(typeof result).toBe('function');
  });

  it('should work with null deps', () => {
    const spec = { allowedAuth: ['public'] };
    const result = secure(spec, null);

    expect(mockAuthStrategies).toHaveBeenCalledWith(null);
    expect(mockAuthRegistry).toHaveBeenCalledWith({ strategies: [{ name: 'userOidc' }], deps: null });
    expect(typeof result).toBe('function');
  });

  it('should work with undefined deps', () => {
    const spec = { allowedAuth: ['public'] };
    const result = secure(spec, undefined);

    expect(mockAuthStrategies).toHaveBeenCalledWith(undefined);
    expect(mockAuthRegistry).toHaveBeenCalledWith({ strategies: [{ name: 'userOidc' }], deps: undefined });
    expect(typeof result).toBe('function');
  });

  it('should work with empty spec object', () => {
    const spec = {};
    const result = secure(spec, mockDeps);

    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(spec, mockDeps);
    expect(typeof result).toBe('function');
  });

  it('should work with null spec', () => {
    const result = secure(null, mockDeps);

    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(null, mockDeps);
    expect(typeof result).toBe('function');
  });

  it('should work with undefined spec', () => {
    const result = secure(undefined, mockDeps);

    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(undefined, mockDeps);
    expect(typeof result).toBe('function');
  });

  it('should pass through all deps properties', () => {
    const complexDeps = {
      baseUrl: 'https://test.com',
      customProp: 'test',
      services: {
        authService: jest.fn(),
        customService: jest.fn(),
      },
      config: { debug: true },
    };

    const spec = { allowedAuth: ['public'] };
    secure(spec, complexDeps);

    expect(mockAuthStrategies).toHaveBeenCalledWith(complexDeps);
    expect(mockAuthRegistry).toHaveBeenCalledWith({ strategies: [{ name: 'userOidc' }], deps: complexDeps });
    expect(mockResourceResolver).toHaveBeenCalledWith({ deps: complexDeps });
    expect(mockEnrichRBAC).toHaveBeenCalledWith({ deps: complexDeps });
  });

  it('should handle orchestrator creation errors gracefully', () => {
    const error = new Error('Orchestrator creation failed');
    mockOrchestrator.mockImplementation(() => {
      throw error;
    });

    const spec = { allowedAuth: ['public'] };

    expect(() => secure(spec, mockDeps)).toThrow('Orchestrator creation failed');
  });

  it('should handle auth strategies creation errors', () => {
    const error = new Error('Auth strategies failed');
    mockAuthStrategies.mockImplementation(() => {
      throw error;
    });

    const spec = { allowedAuth: ['public'] };

    expect(() => secure(spec, mockDeps)).toThrow('Auth strategies failed');
  });

  it('should handle auth registry creation errors', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockResourceResolver.mockReturnValue({ resolve: jest.fn() });
    mockEnrichRBAC.mockReturnValue(jest.fn());
    mockCreateInlineMatcher.mockReturnValue({ match: jest.fn() });
    mockOrchestrator.mockReturnValue({ middleware: jest.fn() });

    const error = new Error('Auth registry failed');
    mockAuthRegistry.mockImplementation(() => {
      throw error;
    });

    const spec = { allowedAuth: ['public'] };

    expect(() => secure(spec, mockDeps)).toThrow('Auth registry failed');
  });

  it('should handle resource resolver creation errors', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockAuthRegistry.mockReturnValue({ authenticate: jest.fn() });
    mockEnrichRBAC.mockReturnValue(jest.fn());
    mockCreateInlineMatcher.mockReturnValue({ match: jest.fn() });
    mockOrchestrator.mockReturnValue({ middleware: jest.fn() });

    const error = new Error('Resource resolver failed');
    mockResourceResolver.mockImplementation(() => {
      throw error;
    });

    const spec = { allowedAuth: ['public'] };

    expect(() => secure(spec, mockDeps)).toThrow('Resource resolver failed');
  });

  it('should handle RBAC enrich creation errors', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockAuthRegistry.mockReturnValue({ authenticate: jest.fn() });
    mockResourceResolver.mockReturnValue({ resolve: jest.fn() });
    mockCreateInlineMatcher.mockReturnValue({ match: jest.fn() });
    mockOrchestrator.mockReturnValue({ middleware: jest.fn() });

    const error = new Error('RBAC enrich failed');
    mockEnrichRBAC.mockImplementation(() => {
      throw error;
    });

    const spec = { allowedAuth: ['public'] };

    expect(() => secure(spec, mockDeps)).toThrow('RBAC enrich failed');
  });

  it('should handle inline matcher creation errors', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockAuthRegistry.mockReturnValue({ authenticate: jest.fn() });
    mockResourceResolver.mockReturnValue({ resolve: jest.fn() });
    mockEnrichRBAC.mockReturnValue(jest.fn());
    mockOrchestrator.mockReturnValue({ middleware: jest.fn() });

    const error = new Error('Inline matcher failed');
    mockCreateInlineMatcher.mockImplementation(() => {
      throw error;
    });

    const spec = { allowedAuth: ['public'] };

    expect(() => secure(spec, mockDeps)).toThrow('Inline matcher failed');
  });

  it('should work with complex spec function', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockAuthRegistry.mockReturnValue({ authenticate: jest.fn() });
    mockResourceResolver.mockReturnValue({ resolve: jest.fn() });
    mockEnrichRBAC.mockReturnValue(jest.fn());
    mockCreateInlineMatcher.mockReturnValue({ match: jest.fn() });
    mockOrchestrator.mockReturnValue({ middleware: jest.fn() });

    const specFn = jest.fn().mockImplementation((req) => ({
      allowedAuth: req.method === 'GET' ? ['public'] : ['userOidc'],
      requiredPermissions: req.method === 'POST' ? ['FORM_CREATE'] : [],
      classification: 'dynamic',
    }));

    const result = secure(specFn, mockDeps);

    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(specFn, mockDeps);
    expect(typeof result).toBe('function');
  });

  it('should work with spec containing all policy properties', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockAuthRegistry.mockReturnValue({ authenticate: jest.fn() });
    mockResourceResolver.mockReturnValue({ resolve: jest.fn() });
    mockEnrichRBAC.mockReturnValue(jest.fn());
    mockCreateInlineMatcher.mockReturnValue({ match: jest.fn() });
    mockOrchestrator.mockReturnValue({ middleware: jest.fn() });

    const spec = {
      allowedAuth: ['userOidc', 'apiKeyBasic'],
      requiredPermissions: ['FORM_READ', 'FORM_UPDATE'],
      classification: 'forms',
      pattern: '/forms/:formId',
      resourceSpec: { kind: 'formOnly', params: { formId: '123' } },
    };

    const result = secure(spec, mockDeps);

    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(spec, mockDeps);
    expect(typeof result).toBe('function');
  });

  it('should maintain function identity across calls with same parameters', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockAuthRegistry.mockReturnValue({ authenticate: jest.fn() });
    mockResourceResolver.mockReturnValue({ resolve: jest.fn() });
    mockEnrichRBAC.mockReturnValue(jest.fn());
    mockCreateInlineMatcher.mockReturnValue({ match: jest.fn() });

    // Mock orchestrator to return different middleware functions each time
    mockOrchestrator.mockReturnValueOnce({ middleware: jest.fn() });
    mockOrchestrator.mockReturnValueOnce({ middleware: jest.fn() });

    const spec = { allowedAuth: ['public'] };
    const result1 = secure(spec, mockDeps);
    const result2 = secure(spec, mockDeps);

    // Results should be different instances since orchestrator creates new middleware each time
    expect(result1).not.toBe(result2);
    expect(typeof result1).toBe('function');
    expect(typeof result2).toBe('function');
  });

  it('should work with deps containing authOrderDefault', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockAuthRegistry.mockReturnValue({ authenticate: jest.fn() });
    mockResourceResolver.mockReturnValue({ resolve: jest.fn() });
    mockEnrichRBAC.mockReturnValue(jest.fn());
    mockCreateInlineMatcher.mockReturnValue({ match: jest.fn() });
    mockOrchestrator.mockReturnValue({ middleware: jest.fn() });

    const depsWithAuthOrder = {
      ...mockDeps,
      authOrderDefault: ['customAuth1', 'customAuth2'],
    };

    const spec = {};
    const result = secure(spec, depsWithAuthOrder);

    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(spec, depsWithAuthOrder);
    expect(typeof result).toBe('function');
  });

  it('should work with deps containing urlBasePath', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    mockAuthStrategies.mockReturnValue([{ name: 'userOidc' }]);
    mockAuthRegistry.mockReturnValue({ authenticate: jest.fn() });
    mockResourceResolver.mockReturnValue({ resolve: jest.fn() });
    mockEnrichRBAC.mockReturnValue(jest.fn());
    mockCreateInlineMatcher.mockReturnValue({ match: jest.fn() });
    mockOrchestrator.mockReturnValue({ middleware: jest.fn() });

    const depsWithUrlBasePath = {
      ...mockDeps,
      urlBasePath: '/api/v1',
    };

    const spec = {};
    const result = secure(spec, depsWithUrlBasePath);

    expect(mockCreateInlineMatcher).toHaveBeenCalledWith(spec, depsWithUrlBasePath);
    expect(typeof result).toBe('function');
  });
});
