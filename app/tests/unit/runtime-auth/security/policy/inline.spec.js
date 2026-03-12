/* eslint-env jest */

// Path constants for easier maintenance
// Test file is at: tests/unit/runtime-auth/security/policy/inline.spec.js
// Source files are at: src/runtime-auth/security/policy/...
// Path: ../../../../../ (5 levels up from policy/ to app/, then down to src/)
const INLINE_PATH = '../../../../../src/runtime-auth/security/policy/inline';

// Mock logger - must use string literal (jest.mock is hoisted)
jest.mock('../../../../../src/runtime-auth/security/logger', () => ({
  policyStore: {
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

// Helper functions for requiring modules
function requireInline() {
  return require(INLINE_PATH);
}

describe('policy/inline', () => {
  let createInlineMatcher;
  let normalizePolicy;
  let inferClassification;
  let inferResourceSpec;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    const module = requireInline();
    createInlineMatcher = module.createInlineMatcher;
    normalizePolicy = module.normalizePolicy;
    inferClassification = module.inferClassification;
    inferResourceSpec = module.inferResourceSpec;
    mockLogger = require('../../../../../src/runtime-auth/security/logger').policyStore;
  });

  describe('createInlineMatcher', () => {
    it('should return an object with match function', () => {
      const matcher = createInlineMatcher({}, {});
      expect(matcher).toHaveProperty('match');
      expect(typeof matcher.match).toBe('function');
    });

    it('should call logger.debug on match start', () => {
      const matcher = createInlineMatcher({}, {});
      const req = { method: 'GET', path: '/test' };
      matcher.match(req);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'policy_match_start',
          method: 'GET',
          path: '/test',
        })
      );
    });

    it('should call logger.info on match complete', () => {
      const matcher = createInlineMatcher({}, {});
      const req = { method: 'GET', path: '/test' };
      matcher.match(req);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'policy_match_complete',
          method: 'GET',
          path: '/test',
        })
      );
    });

    it('should return normalized policy', () => {
      const matcher = createInlineMatcher({ allowedAuth: ['public'] }, {});
      const req = { method: 'GET', path: '/test' };
      const result = matcher.match(req);
      expect(result).toHaveProperty('allowedAuth');
      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('resourceSpec');
      expect(result).toHaveProperty('requiredPermissions');
      expect(result).toHaveProperty('pattern');
    });

    it('should work with function spec', () => {
      const specFn = jest.fn(() => ({ allowedAuth: ['userOidc'] }));
      const matcher = createInlineMatcher(specFn, {});
      const req = { method: 'GET', path: '/test' };
      matcher.match(req);
      expect(specFn).toHaveBeenCalledWith(req);
    });

    it('should log hasRoute and routePath when route exists', () => {
      const matcher = createInlineMatcher({}, {});
      const req = { method: 'GET', path: '/test', route: { path: '/route-path' } };
      matcher.match(req);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          hasRoute: true,
          routePath: '/route-path',
        })
      );
    });
  });

  describe('normalizePolicy', () => {
    it('should use default allowedAuth when not specified', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const result = normalizePolicy({}, req, deps);
      expect(result.allowedAuth).toEqual(['userOidc', 'apiKeyBasic', 'gatewayBearer']);
    });

    it('should use custom authOrderDefault when provided', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = { authOrderDefault: ['custom1', 'custom2'] };
      const result = normalizePolicy({}, req, deps);
      expect(result.allowedAuth).toEqual(['custom1', 'custom2']);
    });

    it('should use empty authOrderDefault array', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = { authOrderDefault: [] };
      const result = normalizePolicy({}, req, deps);
      expect(result.allowedAuth).toEqual(['userOidc', 'apiKeyBasic', 'gatewayBearer']);
    });

    it('should use allowedAuth from spec', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const result = normalizePolicy({ allowedAuth: ['public'] }, req, deps);
      expect(result.allowedAuth).toEqual(['public']);
    });

    it('should use allow alias from spec', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const result = normalizePolicy({ allow: ['public'] }, req, deps);
      expect(result.allowedAuth).toEqual(['public']);
    });

    it('should infer classification when not specified', () => {
      const req = { method: 'GET', path: '/forms/123', url: '/forms/123' };
      const deps = {};
      const result = normalizePolicy({}, req, deps);
      expect(result.classification).toBe('forms');
    });

    it('should use explicit classification', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const result = normalizePolicy({ classification: 'custom' }, req, deps);
      expect(result.classification).toBe('custom');
    });

    it('should use req.route.path as pattern when available', () => {
      const req = { method: 'GET', path: '/actual', route: { path: '/route-path' } };
      const deps = {};
      const result = normalizePolicy({}, req, deps);
      expect(result.pattern).toBe('/route-path');
    });

    it('should use req.path as pattern when route.path not available', () => {
      const req = { method: 'GET', path: '/test-path' };
      const deps = {};
      const result = normalizePolicy({}, req, deps);
      expect(result.pattern).toBe('/test-path');
    });

    it('should use explicit pattern from spec', () => {
      const req = { method: 'GET', path: '/test', route: { path: '/route' } };
      const deps = {};
      const result = normalizePolicy({ pattern: '/explicit' }, req, deps);
      expect(result.pattern).toBe('/explicit');
    });

    it('should infer resourceSpec when not provided', () => {
      const req = { method: 'GET', path: '/forms/123', params: { formId: '123' } };
      const deps = {};
      const result = normalizePolicy({}, req, deps);
      expect(result.resourceSpec).toEqual({ kind: 'formOnly', params: { formId: '123' } });
    });

    it('should use explicit resourceSpec', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const resourceSpec = { kind: 'custom', params: {} };
      const result = normalizePolicy({ resourceSpec }, req, deps);
      expect(result.resourceSpec).toBe(resourceSpec);
    });

    it('should call resource function when provided', () => {
      const req = { method: 'GET', path: '/test', params: { formId: '123' }, query: {} };
      const deps = {};
      const resourceFn = jest.fn(() => ({ kind: 'fromFunction' }));
      const result = normalizePolicy({ resource: resourceFn }, req, deps);
      expect(resourceFn).toHaveBeenCalledWith({ req, params: req.params, query: req.query });
      expect(result.resourceSpec).toEqual({ kind: 'fromFunction', params: { formId: '123' } });
    });

    it('should prefer resourceSpec over resource function', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const resourceFn = jest.fn(() => ({ kind: 'fromFunction' }));
      const resourceSpec = { kind: 'fromSpec' };
      const result = normalizePolicy({ resource: resourceFn, resourceSpec }, req, deps);
      expect(result.resourceSpec).toBe(resourceSpec);
    });

    it('should infer params when resourceSpec lacks params', () => {
      const req = { method: 'GET', path: '/forms/123', params: { formId: '123' } };
      const deps = {};
      const resourceSpec = { kind: 'custom' };
      const result = normalizePolicy({ resourceSpec }, req, deps);
      expect(result.resourceSpec).toEqual({ kind: 'custom', params: { formId: '123' } });
    });

    it('should use requiredPermissions from spec', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const result = normalizePolicy({ requiredPermissions: ['FORM_READ'] }, req, deps);
      expect(result.requiredPermissions).toEqual(['FORM_READ']);
    });

    it('should use require alias from spec', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const result = normalizePolicy({ require: ['FORM_READ'] }, req, deps);
      expect(result.requiredPermissions).toEqual(['FORM_READ']);
    });

    it('should default to empty requiredPermissions', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const result = normalizePolicy({}, req, deps);
      expect(result.requiredPermissions).toEqual([]);
    });

    it('should handle function spec', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const specFn = jest.fn(() => ({ allowedAuth: ['public'] }));
      const result = normalizePolicy(specFn, req, deps);
      expect(specFn).toHaveBeenCalledWith(req);
      expect(result.allowedAuth).toEqual(['public']);
    });

    it('should handle null spec', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const result = normalizePolicy(null, req, deps);
      expect(result).toHaveProperty('allowedAuth');
      expect(result).toHaveProperty('classification');
    });

    it('should handle undefined spec', () => {
      const req = { method: 'GET', path: '/test' };
      const deps = {};
      const result = normalizePolicy(undefined, req, deps);
      expect(result).toHaveProperty('allowedAuth');
      expect(result).toHaveProperty('classification');
    });
  });

  describe('inferClassification', () => {
    it('should infer classification from path', () => {
      const req = { originalUrl: '/forms/123' };
      const deps = {};
      const result = inferClassification(req, deps);
      expect(result).toBe('forms');
    });

    it('should use req.url when originalUrl not available', () => {
      const req = { url: '/submissions/456' };
      const deps = {};
      const result = inferClassification(req, deps);
      expect(result).toBe('submissions');
    });

    it('should default to root when path is empty', () => {
      const req = { url: '/' };
      const deps = {};
      const result = inferClassification(req, deps);
      expect(result).toBe('root');
    });

    it('should strip baseUrl from path', () => {
      const req = { originalUrl: '/api/v1/forms/123' };
      const deps = { baseUrl: '/api/v1' };
      const result = inferClassification(req, deps);
      expect(result).toBe('forms');
    });

    it('should strip urlBasePath from path', () => {
      const req = { originalUrl: '/api/v1/submissions/456' };
      const deps = { urlBasePath: '/api/v1' };
      const result = inferClassification(req, deps);
      expect(result).toBe('submissions');
    });

    it('should handle baseUrl with trailing slash', () => {
      const req = { originalUrl: '/api/v1/forms/123' };
      const deps = { baseUrl: '/api/v1/' };
      const result = inferClassification(req, deps);
      expect(result).toBe('forms');
    });

    it('should handle full URL', () => {
      const req = { originalUrl: 'https://example.com/api/forms/123' };
      const deps = {};
      const result = inferClassification(req, deps);
      expect(result).toBe('api');
    });

    it('should handle invalid URL gracefully', () => {
      const req = { originalUrl: 'not-a-url' };
      const deps = {};
      const result = inferClassification(req, deps);
      expect(result).toBe('not-a-url');
    });

    it('should return root when no path segments', () => {
      const req = {};
      const deps = {};
      const result = inferClassification(req, deps);
      expect(result).toBe('root');
    });

    it('should handle query parameters', () => {
      const req = { originalUrl: '/forms/123?param=value' };
      const deps = {};
      const result = inferClassification(req, deps);
      expect(result).toBe('forms');
    });
  });

  describe('inferResourceSpec', () => {
    it('should infer file resource from fileId param', () => {
      const req = { params: { fileId: 'file-123' } };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'file', params: { fileId: 'file-123' } });
    });

    it('should infer file resource from fileId query', () => {
      const req = { params: {}, query: { fileId: 'file-123' } };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'file', params: { fileId: 'file-123' } });
    });

    it('should prefer fileId from params over query', () => {
      const req = { params: { fileId: 'file-param' }, query: { fileId: 'file-query' } };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'file', params: { fileId: 'file-param' } });
    });

    it('should infer submission resource from submissionId param', () => {
      const req = { params: { formId: 'form-123', submissionId: 'sub-456' } };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'submissionFromForm', params: { formId: 'form-123', submissionId: 'sub-456' } });
    });

    it('should infer submission resource from submissionId query', () => {
      const req = { params: { formId: 'form-123' }, query: { submissionId: 'sub-456' } };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'submissionFromForm', params: { formId: 'form-123', submissionId: 'sub-456' } });
    });

    it('should infer form resource from formId param', () => {
      const req = { params: { formId: 'form-123' } };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'formOnly', params: { formId: 'form-123' } });
    });

    it('should infer form resource from formId query', () => {
      const req = { params: {}, query: { formId: 'form-123' } };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'formOnly', params: { formId: 'form-123' } });
    });

    it('should return none when no resource IDs found', () => {
      const req = { params: {}, query: {} };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'none' });
    });

    it('should prioritize fileId over submissionId', () => {
      const req = { params: { fileId: 'file-123', submissionId: 'sub-456' } };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'file', params: { fileId: 'file-123' } });
    });

    it('should prioritize submissionId over formId', () => {
      const req = { params: { formId: 'form-123', submissionId: 'sub-456' } };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'submissionFromForm', params: { formId: 'form-123', submissionId: 'sub-456' } });
    });

    it('should handle null params', () => {
      const req = { params: null, query: {} };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'none' });
    });

    it('should handle null query', () => {
      const req = { params: {}, query: null };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'none' });
    });

    it('should handle undefined params', () => {
      const req = { query: {} };
      const result = inferResourceSpec(req);
      expect(result).toEqual({ kind: 'none' });
    });
  });
});
