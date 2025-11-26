/**
 * Standardized error messages for runtime-auth
 */
module.exports = {
  // Policy errors
  POLICY_NOT_FOUND: 'Route policy not found',
  RESOURCE_NOT_FOUND: 'Resource not found or relationship mismatch',

  // Authentication errors
  AUTHENTICATION_REQUIRED: 'Authentication required',
  AUTHENTICATION_FAILED: 'Authentication failed for all strategies',
  INVALID_TOKEN: 'Invalid token',
  MISSING_AUTHORIZATION: 'Missing or invalid Authorization header',
  MISSING_TOKEN: 'Missing or invalid Authorization token',
  INVALID_AUTHORIZATION_FORMAT: 'Invalid authorization format',
  INVALID_OIDC_TOKEN: 'Invalid OIDC token',
  INVALID_BASIC_FORMAT: 'Invalid Basic authorization format',
  INVALID_GATEWAY_TOKEN: 'Invalid gateway token',
  GATEWAY_TOKEN_MISSING_CLAIMS: 'Gateway token missing formId or apiKey',
  USER_NOT_FOUND: 'Runtime-auth user not found in database',

  // Authorization errors
  FORBIDDEN: 'Forbidden',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  MISSING_PERMISSIONS: 'Missing required permissions',
  UNAUTHORIZED_FILE_ACCESS: 'Unauthorized to access file',
  UNAUTHORIZED_FILE_UPLOADER: 'Unauthorized - not the file uploader',
  MISSING_FILE_PERMISSIONS: 'Missing required file permissions',
  FILE_NOT_FOUND: 'File not found in security context',

  // Configuration errors
  SECURITY_CONTEXT_MISSING: 'Security context not enriched - runtime-auth middleware not run',
  INVALID_VALIDATION_MODE: 'Invalid validation mode',

  // Service errors (from resolve.js)
  SERVICE_MISSING: (service) => `${service} not available in dependencies. Check your deps.services configuration.`,
  SERVICE_METHOD_INVALID: (service, method) => `${service}.${method} is not a function`,

  // Credential errors
  FORM_OR_API_KEY_NOT_FOUND: 'Form or API key not found',
  INVALID_CREDENTIALS: 'Invalid authorization credentials',
};
