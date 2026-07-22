/* eslint-env jest */

// Path constants for easier maintenance
// Test file is at: tests/unit/runtime-auth/security/policy/centralized.spec.js
// Source files are at: src/runtime-auth/security/policy/...
// Path: ../../../../../ (5 levels up from policy/ to app/, then down to src/)
const CENTRALIZED_PATH = '../../../../../src/runtime-auth/security/policy/centralized';

// Helper functions for requiring modules
function requireCentralized() {
  return require(CENTRALIZED_PATH);
}

describe('policy/centralized', () => {
  let createCentralizedMatcher;
  let extractParams;

  beforeEach(() => {
    jest.clearAllMocks();
    const module = requireCentralized();
    createCentralizedMatcher = module.createCentralizedMatcher;
    extractParams = module.extractParams;
  });

  describe('createCentralizedMatcher', () => {
    it('should return an object with match and policies', () => {
      const matcher = createCentralizedMatcher([]);
      expect(matcher).toHaveProperty('match');
      expect(matcher).toHaveProperty('policies');
      expect(typeof matcher.match).toBe('function');
      expect(Array.isArray(matcher.policies)).toBe(true);
    });

    it('should store policies array', () => {
      const policies = [{ method: 'GET', pattern: '/test' }];
      const matcher = createCentralizedMatcher(policies);
      expect(matcher.policies).toBe(policies);
    });

    it('should work with empty policies array', () => {
      const matcher = createCentralizedMatcher([]);
      const req = { method: 'GET', path: '/test' };
      expect(matcher.match(req)).toBeNull();
    });

    it('should work with undefined policies', () => {
      const matcher = createCentralizedMatcher();
      const req = { method: 'GET', path: '/test' };
      expect(matcher.match(req)).toBeNull();
    });
  });

  describe('match', () => {
    it('should return null when no policy matches', () => {
      const policies = [
        { method: 'GET', pattern: '/forms/:formId' },
        { method: 'POST', pattern: '/forms' },
      ];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'DELETE', path: '/forms/123' };
      expect(matcher.match(req)).toBeNull();
    });

    it('should match policy by method and pattern', () => {
      const policies = [
        { method: 'GET', pattern: '/forms/:formId' },
        { method: 'POST', pattern: '/forms' },
      ];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/forms/123' };
      const result = matcher.match(req);
      expect(result).not.toBeNull();
      expect(result.pattern).toBe('/forms/:formId');
    });

    it('should return policy with default values when fields are missing', () => {
      const policies = [{ method: 'GET', pattern: '/test' }];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/test' };
      const result = matcher.match(req);
      expect(result.allowedAuth).toEqual([]);
      expect(result.requiredPermissions).toEqual([]);
      expect(result.resourceSpec).toEqual({ kind: 'none' });
      expect(result.pattern).toBe('/test');
    });

    it('should return policy with all fields when provided', () => {
      const policies = [
        {
          method: 'GET',
          pattern: '/forms/:formId',
          allowedAuth: ['userOidc', 'apiKeyBasic'],
          classification: 'restricted',
          resourceSpec: { kind: 'formOnly', params: { formId: '123' } },
          requiredPermissions: ['FORM_READ'],
        },
      ];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/forms/123' };
      const result = matcher.match(req);
      expect(result.allowedAuth).toEqual(['userOidc', 'apiKeyBasic']);
      expect(result.classification).toBe('restricted');
      expect(result.resourceSpec).toEqual({ kind: 'formOnly', params: { formId: '123' } });
      expect(result.requiredPermissions).toEqual(['FORM_READ']);
      expect(result.pattern).toBe('/forms/:formId');
    });

    it('should use resource function when provided', () => {
      const mockReq = { method: 'GET', path: '/forms/123' };
      const resourceFn = jest.fn((req, params) => ({ kind: 'formOnly', params }));
      const policies = [
        {
          method: 'GET',
          pattern: '/forms/:formId',
          resource: resourceFn,
        },
      ];
      const matcher = createCentralizedMatcher(policies);
      const result = matcher.match(mockReq);
      expect(resourceFn).toHaveBeenCalledWith(mockReq, { formId: '123' });
      expect(result.resourceSpec).toEqual({ kind: 'formOnly', params: { formId: '123' } });
    });

    it('should prefer resource function over resourceSpec', () => {
      const resourceFn = jest.fn(() => ({ kind: 'fromFunction' }));
      const policies = [
        {
          method: 'GET',
          pattern: '/test',
          resource: resourceFn,
          resourceSpec: { kind: 'fromSpec' },
        },
      ];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/test' };
      const result = matcher.match(req);
      expect(result.resourceSpec).toEqual({ kind: 'fromFunction' });
    });

    it('should use resourceSpec when resource function is not provided', () => {
      const policies = [
        {
          method: 'GET',
          pattern: '/test',
          resourceSpec: { kind: 'fromSpec' },
        },
      ];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/test' };
      const result = matcher.match(req);
      expect(result.resourceSpec).toEqual({ kind: 'fromSpec' });
    });

    it('should copy allowedAuth array', () => {
      const allowedAuth = ['userOidc'];
      const policies = [
        {
          method: 'GET',
          pattern: '/test',
          allowedAuth,
        },
      ];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/test' };
      const result = matcher.match(req);
      expect(result.allowedAuth).not.toBe(allowedAuth);
      expect(result.allowedAuth).toEqual(allowedAuth);
    });

    it('should copy requiredPermissions array', () => {
      const requiredPermissions = ['FORM_READ'];
      const policies = [
        {
          method: 'GET',
          pattern: '/test',
          requiredPermissions,
        },
      ];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/test' };
      const result = matcher.match(req);
      expect(result.requiredPermissions).not.toBe(requiredPermissions);
      expect(result.requiredPermissions).toEqual(requiredPermissions);
    });

    it('should use req.path when available', () => {
      const policies = [{ method: 'GET', pattern: '/test' }];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/test' };
      const result = matcher.match(req);
      expect(result).not.toBeNull();
    });

    it('should use req.url when path is not available', () => {
      const policies = [{ method: 'GET', pattern: '/test' }];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', url: '/test' };
      const result = matcher.match(req);
      expect(result).not.toBeNull();
    });

    it('should match first policy when multiple policies match', () => {
      const policies = [
        { method: 'GET', pattern: '/forms/:formId', classification: 'first' },
        { method: 'GET', pattern: '/forms/:formId', classification: 'second' },
      ];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/forms/123' };
      const result = matcher.match(req);
      expect(result.classification).toBe('first');
    });

    it('should handle complex route patterns with multiple parameters', () => {
      const policies = [
        {
          method: 'GET',
          pattern: '/forms/:formId/submissions/:submissionId/files/:fileId',
        },
      ];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/forms/123/submissions/456/files/789' };
      const result = matcher.match(req);
      expect(result).not.toBeNull();
      expect(result.pattern).toBe('/forms/:formId/submissions/:submissionId/files/:fileId');
    });

    it('should not match when method differs', () => {
      const policies = [{ method: 'GET', pattern: '/forms/:formId' }];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'POST', path: '/forms/123' };
      expect(matcher.match(req)).toBeNull();
    });

    it('should not match when pattern differs', () => {
      const policies = [{ method: 'GET', pattern: '/forms/:formId' }];
      const matcher = createCentralizedMatcher(policies);
      const req = { method: 'GET', path: '/submissions/123' };
      expect(matcher.match(req)).toBeNull();
    });
  });

  describe('extractParams', () => {
    it('should extract single parameter', () => {
      const result = extractParams('/forms/:formId', '/forms/123');
      expect(result).toEqual({ formId: '123' });
    });

    it('should extract multiple parameters', () => {
      const result = extractParams('/forms/:formId/submissions/:submissionId', '/forms/123/submissions/456');
      expect(result).toEqual({ formId: '123', submissionId: '456' });
    });

    it('should return null when segment counts differ', () => {
      const result = extractParams('/forms/:formId', '/forms/123/extra');
      expect(result).toBeNull();
    });

    it('should return null when literal segments do not match', () => {
      const result = extractParams('/forms/:formId', '/submissions/123');
      expect(result).toBeNull();
    });

    it('should handle URL-encoded parameters', () => {
      const encoded = encodeURIComponent('test%20value');
      const result = extractParams('/forms/:formId', `/forms/${encoded}`);
      expect(result).toEqual({ formId: 'test%20value' });
    });

    it('should handle empty path segments', () => {
      const result = extractParams('/', '/');
      expect(result).toEqual({});
    });

    it('should handle trailing slashes consistently', () => {
      const result1 = extractParams('/forms/:formId', '/forms/123');
      const result2 = extractParams('/forms/:formId/', '/forms/123/');
      expect(result1).toEqual({ formId: '123' });
      expect(result2).toEqual({ formId: '123' });
    });

    it('should handle parameters with special characters', () => {
      const special = 'test-123_abc';
      const result = extractParams('/forms/:formId', `/forms/${special}`);
      expect(result).toEqual({ formId: special });
    });

    it('should decode URL-encoded plus signs', () => {
      const result = extractParams('/forms/:formId', '/forms/test+value');
      expect(result).toEqual({ formId: 'test+value' });
    });

    it('should handle numeric parameter values', () => {
      const result = extractParams('/forms/:formId', '/forms/12345');
      expect(result).toEqual({ formId: '12345' });
    });

    it('should handle multiple consecutive parameters', () => {
      const result = extractParams('/:a/:b/:c', '/1/2/3');
      expect(result).toEqual({ a: '1', b: '2', c: '3' });
    });

    it('should return null for empty pattern', () => {
      const result = extractParams('', '/test');
      expect(result).toBeNull();
    });

    it('should return null for empty path', () => {
      const result = extractParams('/test', '');
      expect(result).toBeNull();
    });

    it('should handle pattern with no parameters', () => {
      const result = extractParams('/health/public', '/health/public');
      expect(result).toEqual({});
    });

    it('should return null when pattern has no parameters but path differs', () => {
      const result = extractParams('/health/public', '/health/private');
      expect(result).toBeNull();
    });
  });
});
