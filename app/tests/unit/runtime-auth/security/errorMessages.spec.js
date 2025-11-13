/* eslint-env jest */

const ERRORS = require('../../../../src/runtime-auth/security/errorMessages');

describe('errorMessages', () => {
  it('should export all required error constants', () => {
    expect(ERRORS.POLICY_NOT_FOUND).toBe('Route policy not found');
    expect(ERRORS.RESOURCE_NOT_FOUND).toBe('Resource not found or relationship mismatch');
    expect(ERRORS.AUTHENTICATION_REQUIRED).toBe('Authentication required');
    expect(ERRORS.AUTHENTICATION_FAILED).toBe('Authentication failed for all strategies');
    expect(ERRORS.INVALID_TOKEN).toBe('Invalid token');
    expect(ERRORS.MISSING_AUTHORIZATION).toBe('Missing or invalid Authorization header');
    expect(ERRORS.MISSING_TOKEN).toBe('Missing or invalid Authorization token');
    expect(ERRORS.INVALID_AUTHORIZATION_FORMAT).toBe('Invalid authorization format');
    expect(ERRORS.INVALID_OIDC_TOKEN).toBe('Invalid OIDC token');
    expect(ERRORS.INVALID_BASIC_FORMAT).toBe('Invalid Basic authorization format');
    expect(ERRORS.INVALID_GATEWAY_TOKEN).toBe('Invalid gateway token');
    expect(ERRORS.GATEWAY_TOKEN_MISSING_CLAIMS).toBe('Gateway token missing formId or apiKey');
    expect(ERRORS.USER_NOT_FOUND).toBe('Runtime-auth user not found in database');
  });

  it('should export authorization error constants', () => {
    expect(ERRORS.FORBIDDEN).toBe('Forbidden');
    expect(ERRORS.INSUFFICIENT_PERMISSIONS).toBe('Insufficient permissions');
    expect(ERRORS.MISSING_PERMISSIONS).toBe('Missing required permissions');
    expect(ERRORS.UNAUTHORIZED_FILE_ACCESS).toBe('Unauthorized to access file');
    expect(ERRORS.UNAUTHORIZED_FILE_UPLOADER).toBe('Unauthorized - not the file uploader');
    expect(ERRORS.MISSING_FILE_PERMISSIONS).toBe('Missing required file permissions');
    expect(ERRORS.FILE_NOT_FOUND).toBe('File not found in security context');
  });

  it('should export configuration error constants', () => {
    expect(ERRORS.SECURITY_CONTEXT_MISSING).toBe('Security context not enriched - runtime-auth middleware not run');
    expect(ERRORS.INVALID_VALIDATION_MODE).toBe('Invalid validation mode');
  });

  it('should export service error functions', () => {
    expect(typeof ERRORS.SERVICE_MISSING).toBe('function');
    expect(typeof ERRORS.SERVICE_METHOD_INVALID).toBe('function');

    expect(ERRORS.SERVICE_MISSING('testService')).toBe('testService not available in dependencies. Check your deps.services configuration.');
    expect(ERRORS.SERVICE_METHOD_INVALID('testService', 'testMethod')).toBe('testService.testMethod is not a function');
  });

  it('should export credential error constants', () => {
    expect(ERRORS.FORM_OR_API_KEY_NOT_FOUND).toBe('Form or API key not found');
    expect(ERRORS.INVALID_CREDENTIALS).toBe('Invalid authorization credentials');
  });
});
