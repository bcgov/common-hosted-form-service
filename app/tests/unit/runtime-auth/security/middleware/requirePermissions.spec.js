/* eslint-env jest */

// Path constants for easier maintenance
// Test file is at: tests/unit/runtime-auth/security/middleware/requirePermissions.spec.js
// Source files are at: src/runtime-auth/security/...
// Path: ../../../../../ (6 levels up from middleware/ to app/, then down to src/)
const REQUIRE_PERMISSIONS_PATH = '../../../../../src/runtime-auth/security/middleware/requirePermissions';
const HTTP_STATUS_PATH = '../../../../../src/runtime-auth/security/httpStatus';
const ERROR_MESSAGES_PATH = '../../../../../src/runtime-auth/security/errorMessages';

// Helper functions for requiring modules
function requireRequirePermissions() {
  return require(REQUIRE_PERMISSIONS_PATH);
}

function requireHttpStatus() {
  return require(HTTP_STATUS_PATH);
}

function requireErrorMessages() {
  return require(ERROR_MESSAGES_PATH);
}

function callMiddleware(middleware, req, res) {
  return new Promise((resolve, reject) => {
    const next = (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };
    middleware(req, res, next);
  });
}

describe('middleware/requirePermissions', () => {
  let requirePermissions;
  let HTTP_STATUS;
  let ERRORS;

  beforeEach(() => {
    jest.resetModules();
    requirePermissions = requireRequirePermissions();
    HTTP_STATUS = requireHttpStatus().HTTP_STATUS;
    ERRORS = requireErrorMessages();
  });

  it('should be a function', () => {
    expect(typeof requirePermissions).toBe('function');
  });

  it('should return a middleware function when called', () => {
    const middleware = requirePermissions(['PERMISSION_READ']);
    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3); // req, res, next
  });

  describe('single permission string', () => {
    it('should allow when user has the required permission', async () => {
      const middleware = requirePermissions('PERMISSION_READ');
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ', 'PERMISSION_UPDATE'],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });

    it('should deny when user is missing the required permission', async () => {
      const middleware = requirePermissions('PERMISSION_READ');
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_UPDATE'],
          },
        },
      };
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.FORBIDDEN,
        detail: expect.stringContaining(ERRORS.INSUFFICIENT_PERMISSIONS),
        required: ['PERMISSION_READ'],
        granted: ['PERMISSION_UPDATE'],
        missing: ['PERMISSION_READ'],
      });
    });
  });

  describe('array of permissions', () => {
    it('should allow when user has all required permissions (default all mode)', async () => {
      const middleware = requirePermissions(['PERMISSION_READ', 'PERMISSION_UPDATE']);
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ', 'PERMISSION_UPDATE', 'PERMISSION_DELETE'],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });

    it('should deny when user is missing any required permission (default all mode)', async () => {
      const middleware = requirePermissions(['PERMISSION_READ', 'PERMISSION_UPDATE']);
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ'],
          },
        },
      };
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.FORBIDDEN,
        missing: ['PERMISSION_UPDATE'],
        mode: 'all',
      });
    });

    it('should allow when user has any required permission (any mode)', async () => {
      const middleware = requirePermissions(['PERMISSION_READ', 'PERMISSION_UPDATE'], 'any');
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ'],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });

    it('should deny when user has none of the required permissions (any mode)', async () => {
      const middleware = requirePermissions(['PERMISSION_READ', 'PERMISSION_UPDATE'], 'any');
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_DELETE'],
          },
        },
      };
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.FORBIDDEN,
        mode: 'any',
      });
    });
  });

  describe('options object', () => {
    it('should handle options object with perms array', async () => {
      const middleware = requirePermissions({ perms: ['PERMISSION_READ', 'PERMISSION_UPDATE'], mode: 'all' });
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ', 'PERMISSION_UPDATE'],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });

    it('should handle options object with permissions array', async () => {
      const middleware = requirePermissions({ permissions: ['PERMISSION_READ'], mode: 'all' });
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ'],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });

    it('should handle options object with only mode', async () => {
      const middleware = requirePermissions({ mode: 'any' });
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ'],
            required: ['PERMISSION_READ', 'PERMISSION_UPDATE'],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });

    it('should handle single permission in options object', async () => {
      const middleware = requirePermissions({ perms: 'PERMISSION_READ' });
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ'],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });
  });

  describe('error handling', () => {
    it('should return 500 error when security context is missing', async () => {
      const middleware = requirePermissions(['PERMISSION_READ']);
      const req = {};
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        detail: ERRORS.SECURITY_CONTEXT_MISSING,
      });
    });

    it('should return 500 error when RBAC context is missing', async () => {
      const middleware = requirePermissions(['PERMISSION_READ']);
      const req = {
        securityContext: {},
      };
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        detail: ERRORS.SECURITY_CONTEXT_MISSING,
      });
    });
  });

  describe('empty permissions', () => {
    it('should allow when no permissions are required', async () => {
      const middleware = requirePermissions([]);
      const req = {
        securityContext: {
          rbac: {
            permissions: [],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });

    it('should allow when permissions come from context and are empty', async () => {
      const middleware = requirePermissions({ mode: 'all' });
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ'],
            required: [],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });
  });

  describe('using context required permissions', () => {
    it('should use permissions from context when not provided', async () => {
      const middleware = requirePermissions({ mode: 'all' });
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ', 'PERMISSION_UPDATE'],
            required: ['PERMISSION_READ'],
          },
        },
      };
      const res = {};

      await callMiddleware(middleware, req, res);
    });

    it('should deny when context required permissions are not met', async () => {
      const middleware = requirePermissions({ mode: 'all' });
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ'],
            required: ['PERMISSION_READ', 'PERMISSION_UPDATE'],
          },
        },
      };
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.FORBIDDEN,
        required: ['PERMISSION_READ', 'PERMISSION_UPDATE'],
      });
    });
  });

  describe('error details', () => {
    it('should include decisions in error when available', async () => {
      const middleware = requirePermissions(['PERMISSION_READ']);
      const req = {
        securityContext: {
          rbac: {
            permissions: [],
            decisions: [{ predicate: 'test', result: false }],
          },
        },
      };
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        decisions: [{ predicate: 'test', result: false }],
      });
    });

    it('should include all error details when permissions are missing', async () => {
      const middleware = requirePermissions(['PERMISSION_READ', 'PERMISSION_UPDATE', 'PERMISSION_DELETE']);
      const req = {
        securityContext: {
          rbac: {
            permissions: ['PERMISSION_READ'],
          },
        },
      };
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        required: ['PERMISSION_READ', 'PERMISSION_UPDATE', 'PERMISSION_DELETE'],
        granted: ['PERMISSION_READ'],
        missing: ['PERMISSION_UPDATE', 'PERMISSION_DELETE'],
        mode: 'all',
      });
    });
  });
});
