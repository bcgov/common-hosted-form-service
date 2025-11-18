/* eslint-env jest */

// Path constants for easier maintenance
// Test file is at: tests/unit/runtime-auth/security/orchestrator.spec.js
// Source files are at: src/runtime-auth/security/...
// Path: ../../../../ (4 levels up from security/ to app/, then down to src/)
const ORCHESTRATOR_PATH = '../../../../src/runtime-auth/security/orchestrator';
const HTTP_STATUS_PATH = '../../../../src/runtime-auth/security/httpStatus';
const ERROR_MESSAGES_PATH = '../../../../src/runtime-auth/security/errorMessages';

// Helper functions for requiring modules
function requireOrchestrator() {
  return require(ORCHESTRATOR_PATH);
}

function requireHttpStatus() {
  return require(HTTP_STATUS_PATH);
}

function requireErrorMessages() {
  return require(ERROR_MESSAGES_PATH);
}

// Mock dependencies - must use string literals (jest.mock is hoisted)
jest.mock('../../../../src/runtime-auth/security/auth/utils/currentUser', () => ({
  generateCurrentUserFromActor: jest.fn((actor) => ({
    id: actor.id,
    username: actor.username,
    email: actor.email,
  })),
  isApiUser: jest.fn((actor) => actor.type === 'api' || actor.type === 'gateway'),
}));

jest.mock('../../../../src/runtime-auth/security/auth/utils/validatePermissions', () => ({
  validatePermissionsLogic: jest.fn((required, granted) => {
    const hasAll = required.every((perm) => granted.includes(perm));
    return {
      isValid: hasAll,
      missing: required.filter((perm) => !granted.includes(perm)),
    };
  }),
}));

jest.mock('../../../../src/runtime-auth/security/logger', () => ({
  orchestrator: {
    info: jest.fn(),
    warn: jest.fn(),
  },
  logPerformance: jest.fn(),
  logPermissionCheck: jest.fn(),
}));

jest.mock('cls-rtracer', () => ({
  id: jest.fn(() => 'test-correlation-id'),
}));

describe('orchestrator', () => {
  let makeOrchestrator;
  let HTTP_STATUS;
  let ERRORS;
  let mockPolicyStore;
  let mockAuthRegistry;
  let mockResolver;
  let mockEnrichRBAC;
  let mockDeps;
  let mockClock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));

    makeOrchestrator = requireOrchestrator();
    HTTP_STATUS = requireHttpStatus().HTTP_STATUS;
    ERRORS = requireErrorMessages();

    mockClock = {
      now: jest.fn(() => Date.now()),
    };

    mockPolicyStore = {
      match: jest.fn(),
    };

    mockAuthRegistry = {
      authenticate: jest.fn(),
    };

    mockResolver = {
      resolve: jest.fn(),
    };

    mockEnrichRBAC = jest.fn();

    mockDeps = {
      clock: mockClock,
      services: {},
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be a function', () => {
    expect(typeof makeOrchestrator).toBe('function');
  });

  it('should return middleware function', () => {
    const orchestrator = makeOrchestrator({
      deps: mockDeps,
      policyStore: mockPolicyStore,
      authRegistry: mockAuthRegistry,
      resolver: mockResolver,
      enrichRBAC: mockEnrichRBAC,
    });

    expect(orchestrator).toHaveProperty('middleware');
    expect(typeof orchestrator.middleware).toBe('function');
    expect(orchestrator.middleware.length).toBe(3); // req, res, next
  });

  it('should use default clock if not provided', () => {
    const orchestrator = makeOrchestrator({
      deps: {},
      policyStore: mockPolicyStore,
      authRegistry: mockAuthRegistry,
      resolver: mockResolver,
      enrichRBAC: mockEnrichRBAC,
    });

    expect(orchestrator).toHaveProperty('middleware');
    expect(typeof orchestrator.middleware).toBe('function');
  });

  describe('successful request flow', () => {
    it('should complete full request flow successfully', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/forms/123',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      const mockPolicy = {
        pattern: '/forms/:formId',
        allowedAuth: ['userOidc'],
        requiredPermissions: [],
        classification: 'forms',
      };

      const mockWho = {
        authType: 'user',
        actor: {
          type: 'user',
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      const mockResource = {
        kind: 'formOnly',
        id: 'form-123',
      };

      const mockRBAC = {
        permissions: ['FORM_READ'],
        decisions: [],
      };

      mockPolicyStore.match.mockReturnValue(mockPolicy);
      mockAuthRegistry.authenticate.mockResolvedValue(mockWho);
      mockResolver.resolve.mockResolvedValue(mockResource);
      mockEnrichRBAC.mockResolvedValue(mockRBAC);

      await orchestrator.middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.securityContext).toBeDefined();
      expect(req.securityContext.who).toBe(mockWho);
      expect(req.securityContext.resource).toBe(mockResource);
      expect(req.securityContext.rbac).toBe(mockRBAC);
      expect(req.currentUser).toBeDefined();
      expect(req.apiUser).toBe(false);
    });

    it('should attach security context with correct structure', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'POST',
        path: '/forms/123/submissions',
        query: { filter: 'active' },
      };
      const res = {};
      const next = jest.fn();

      const mockPolicy = {
        pattern: '/forms/:formId/submissions',
        allowedAuth: ['apiKeyBasic'],
        requiredPermissions: [],
        classification: 'submissions',
      };

      const mockWho = {
        authType: 'api',
        actor: {
          type: 'api',
          id: 'api-123',
        },
      };

      const mockResource = {
        kind: 'submissionFromForm',
        id: 'submission-456',
      };

      const mockRBAC = {
        permissions: [],
        decisions: [],
      };

      mockPolicyStore.match.mockReturnValue(mockPolicy);
      mockAuthRegistry.authenticate.mockResolvedValue(mockWho);
      mockResolver.resolve.mockResolvedValue(mockResource);
      mockEnrichRBAC.mockResolvedValue(mockRBAC);

      await orchestrator.middleware(req, res, next);

      expect(req.securityContext).toBeDefined();
      expect(req.securityContext.correlationId).toBe('test-correlation-id');
      expect(req.securityContext.route.method).toBe('POST');
      expect(req.securityContext.route.pattern).toBe('/forms/:formId/submissions');
      expect(req.securityContext.route.path).toBe('/forms/123/submissions');
      expect(req.securityContext.route.query).toEqual({ filter: 'active' });
      expect(req.securityContext.route.classification).toBe('submissions');
      expect(req.securityContext.timings).toBeDefined();
      expect(req.securityContext.timings.t_auth).toBeGreaterThanOrEqual(0);
      expect(req.securityContext.timings.t_res).toBeGreaterThanOrEqual(0);
      expect(req.securityContext.timings.t_rbac).toBeGreaterThanOrEqual(0);
      expect(req.securityContext.timings.total).toBeGreaterThanOrEqual(0);
    });

    it('should set req.currentUser and req.apiUser for backward compatibility', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/test',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      const mockWho = {
        authType: 'gateway',
        actor: {
          type: 'gateway',
          id: 'gateway-123',
          username: 'gateway-user',
          email: 'gateway@example.com',
        },
      };

      mockPolicyStore.match.mockReturnValue({ allowedAuth: [], requiredPermissions: [] });
      mockAuthRegistry.authenticate.mockResolvedValue(mockWho);
      mockResolver.resolve.mockResolvedValue({ kind: 'none' });
      mockEnrichRBAC.mockResolvedValue({ permissions: [] });

      await orchestrator.middleware(req, res, next);

      expect(req.currentUser).toBeDefined();
      expect(req.currentUser.id).toBe('gateway-123');
      expect(req.apiUser).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return 404 when policy is not found', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/unknown',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      mockPolicyStore.match.mockReturnValue(null);

      await orchestrator.middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HTTP_STATUS.NOT_FOUND,
          detail: ERRORS.POLICY_NOT_FOUND,
        })
      );
    });

    it('should return 404 when resource is not found', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/forms/123',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      mockPolicyStore.match.mockReturnValue({ allowedAuth: [], requiredPermissions: [] });
      mockAuthRegistry.authenticate.mockResolvedValue({ actor: { type: 'user' } });
      mockResolver.resolve.mockResolvedValue(null);

      await orchestrator.middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HTTP_STATUS.NOT_FOUND,
          detail: ERRORS.RESOURCE_NOT_FOUND,
        })
      );
    });

    it('should propagate authentication errors', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/test',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      const authError = new Error('Authentication failed');
      authError.status = 401;

      mockPolicyStore.match.mockReturnValue({ allowedAuth: [], requiredPermissions: [] });
      mockAuthRegistry.authenticate.mockRejectedValue(authError);

      await orchestrator.middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(authError);
    });

    it('should propagate resource resolution errors', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/test',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      const resolveError = new Error('Resource resolution failed');
      resolveError.status = 500;

      mockPolicyStore.match.mockReturnValue({ allowedAuth: [], requiredPermissions: [] });
      mockAuthRegistry.authenticate.mockResolvedValue({ actor: { type: 'user' } });
      mockResolver.resolve.mockRejectedValue(resolveError);

      await orchestrator.middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(resolveError);
    });

    it('should propagate RBAC enrichment errors', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/test',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      const rbacError = new Error('RBAC enrichment failed');
      rbacError.status = 500;

      mockPolicyStore.match.mockReturnValue({ allowedAuth: [], requiredPermissions: [] });
      mockAuthRegistry.authenticate.mockResolvedValue({ actor: { type: 'user' } });
      mockResolver.resolve.mockResolvedValue({ kind: 'none' });
      mockEnrichRBAC.mockRejectedValue(rbacError);

      await orchestrator.middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(rbacError);
    });
  });

  describe('permission validation', () => {
    it('should allow when user has all required permissions', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/forms/123',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      const mockPolicy = {
        allowedAuth: [],
        requiredPermissions: ['FORM_READ', 'FORM_UPDATE'],
      };

      const mockRBAC = {
        permissions: ['FORM_READ', 'FORM_UPDATE', 'FORM_DELETE'],
        decisions: [],
      };

      mockPolicyStore.match.mockReturnValue(mockPolicy);
      mockAuthRegistry.authenticate.mockResolvedValue({ actor: { type: 'user' } });
      mockResolver.resolve.mockResolvedValue({ kind: 'formOnly' });
      mockEnrichRBAC.mockResolvedValue(mockRBAC);

      await orchestrator.middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny when user is missing required permissions', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'DELETE',
        path: '/forms/123',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      const mockPolicy = {
        pattern: '/forms/:formId',
        allowedAuth: [],
        requiredPermissions: ['FORM_DELETE'],
      };

      const mockRBAC = {
        permissions: ['FORM_READ'],
        decisions: [{ predicate: 'test', result: false }],
      };

      mockPolicyStore.match.mockReturnValue(mockPolicy);
      mockAuthRegistry.authenticate.mockResolvedValue({ actor: { type: 'user', id: 'user-123' } });
      mockResolver.resolve.mockResolvedValue({ kind: 'formOnly' });
      mockEnrichRBAC.mockResolvedValue(mockRBAC);

      await orchestrator.middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HTTP_STATUS.FORBIDDEN,
          detail: ERRORS.MISSING_PERMISSIONS,
          required: ['FORM_DELETE'],
          granted: ['FORM_READ'],
          missing: ['FORM_DELETE'],
          mode: 'all',
          decisions: mockRBAC.decisions,
        })
      );
    });

    it('should allow when no permissions are required', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/public',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      const mockPolicy = {
        allowedAuth: [],
        requiredPermissions: [],
      };

      const mockRBAC = {
        permissions: [],
        decisions: [],
      };

      mockPolicyStore.match.mockReturnValue(mockPolicy);
      mockAuthRegistry.authenticate.mockResolvedValue({ actor: { type: 'user' } });
      mockResolver.resolve.mockResolvedValue({ kind: 'none' });
      mockEnrichRBAC.mockResolvedValue(mockRBAC);

      await orchestrator.middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('timing measurements', () => {
    it('should measure and include timing information', async () => {
      const orchestrator = makeOrchestrator({
        deps: mockDeps,
        policyStore: mockPolicyStore,
        authRegistry: mockAuthRegistry,
        resolver: mockResolver,
        enrichRBAC: mockEnrichRBAC,
      });

      const req = {
        method: 'GET',
        path: '/test',
        query: {},
      };
      const res = {};
      const next = jest.fn();

      let callCount = 0;
      mockClock.now.mockImplementation(() => {
        callCount++;
        return 1000 + callCount * 10; // Simulate timing progression
      });

      mockPolicyStore.match.mockReturnValue({ allowedAuth: [], requiredPermissions: [] });
      mockAuthRegistry.authenticate.mockResolvedValue({ actor: { type: 'user' } });
      mockResolver.resolve.mockResolvedValue({ kind: 'none' });
      mockEnrichRBAC.mockResolvedValue({ permissions: [] });

      await orchestrator.middleware(req, res, next);

      expect(req.securityContext.timings).toBeDefined();
      expect(req.securityContext.timings.t_auth).toBeGreaterThanOrEqual(0);
      expect(req.securityContext.timings.t_res).toBeGreaterThanOrEqual(0);
      expect(req.securityContext.timings.t_rbac).toBeGreaterThanOrEqual(0);
      expect(req.securityContext.timings.total).toBeGreaterThanOrEqual(0);
    });
  });
});
