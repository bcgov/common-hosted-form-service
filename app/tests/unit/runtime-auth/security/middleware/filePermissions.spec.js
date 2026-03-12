/* eslint-env jest */

// Path constants for easier maintenance
const FILE_PERMISSIONS_PATH = '../../../../../src/runtime-auth/security/middleware/filePermissions';
const HTTP_STATUS_PATH = '../../../../../src/runtime-auth/security/httpStatus';
const ERROR_MESSAGES_PATH = '../../../../../src/runtime-auth/security/errorMessages';
const PREDICATES_PATH = '../../../../../src/runtime-auth/security/predicates';

// Helper functions for requiring modules
function requireFilePermissions() {
  return require(FILE_PERMISSIONS_PATH);
}

function requireHttpStatus() {
  return require(HTTP_STATUS_PATH);
}

function requireErrorMessages() {
  return require(ERROR_MESSAGES_PATH);
}

function requirePredicates() {
  return require(PREDICATES_PATH);
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

describe('middleware/filePermissions', () => {
  let { hasFileCreate, hasFilePermissions } = requireFilePermissions();
  let HTTP_STATUS;
  let ERRORS;
  let PREDICATES;

  beforeEach(() => {
    jest.resetModules();
    const filePermissions = requireFilePermissions();
    hasFileCreate = filePermissions.hasFileCreate;
    hasFilePermissions = filePermissions.hasFilePermissions;
    HTTP_STATUS = requireHttpStatus().HTTP_STATUS;
    ERRORS = requireErrorMessages();
    PREDICATES = requirePredicates();
  });

  describe('hasFileCreate', () => {
    it('should be a function', () => {
      expect(typeof hasFileCreate).toBe('function');
    });

    it('should return 500 error when security context is missing', async () => {
      const req = {};
      const res = {};

      await expect(callMiddleware(hasFileCreate, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        detail: ERRORS.SECURITY_CONTEXT_MISSING,
      });
    });

    it('should return 500 error when RBAC context is missing', async () => {
      const req = {
        securityContext: {},
      };
      const res = {};

      await expect(callMiddleware(hasFileCreate, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        detail: ERRORS.SECURITY_CONTEXT_MISSING,
      });
    });

    it('should deny when API user file create is denied', async () => {
      const req = {
        securityContext: {
          rbac: {
            decisions: [
              {
                predicate: PREDICATES.API_USER_FILE_CREATE,
                result: false,
              },
            ],
          },
        },
      };
      const res = {};

      await expect(callMiddleware(hasFileCreate, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.FORBIDDEN,
        detail: 'File upload denied for this API key',
      });
    });

    it('should allow when API user file create is approved', async () => {
      const req = {
        securityContext: {
          rbac: {
            decisions: [
              {
                predicate: PREDICATES.API_USER_FILE_CREATE,
                result: true,
              },
            ],
          },
        },
      };
      const res = {};

      await callMiddleware(hasFileCreate, req, res);
    });

    it('should allow authenticated OIDC users', async () => {
      const req = {
        securityContext: {
          rbac: {
            decisions: [],
          },
          who: {
            actor: {
              type: 'user',
              id: 'user-123',
            },
          },
        },
      };
      const res = {};

      await callMiddleware(hasFileCreate, req, res);
    });

    it('should allow when form is public', async () => {
      const req = {
        securityContext: {
          rbac: {
            decisions: [],
          },
          resource: {
            publicForm: true,
          },
        },
      };
      const res = {};

      await callMiddleware(hasFileCreate, req, res);
    });

    it('should deny when form is not public and user is not authenticated', async () => {
      const req = {
        securityContext: {
          rbac: {
            decisions: [],
          },
          resource: {
            publicForm: false,
          },
        },
      };
      const res = {};

      await expect(callMiddleware(hasFileCreate, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.FORBIDDEN,
        detail: 'Authentication required for file uploads on this form',
      });
    });

    it('should allow API user even when form is not public', async () => {
      const req = {
        securityContext: {
          rbac: {
            decisions: [
              {
                predicate: PREDICATES.API_USER_FILE_CREATE,
                result: true,
              },
            ],
          },
          resource: {
            publicForm: false,
          },
        },
      };
      const res = {};

      await callMiddleware(hasFileCreate, req, res);
    });
  });

  describe('hasFilePermissions', () => {
    it('should return a function when called with permissions', () => {
      const middleware = hasFilePermissions(['PERMISSION_READ']);
      expect(typeof middleware).toBe('function');
    });

    it('should return 500 error when security context is missing', async () => {
      const middleware = hasFilePermissions(['PERMISSION_READ']);
      const req = {};
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        detail: ERRORS.SECURITY_CONTEXT_MISSING,
      });
    });

    it('should return 500 error when RBAC context is missing', async () => {
      const middleware = hasFilePermissions(['PERMISSION_READ']);
      const req = {
        securityContext: {},
      };
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        detail: ERRORS.SECURITY_CONTEXT_MISSING,
      });
    });

    it('should return 404 error when file is not found', async () => {
      const middleware = hasFilePermissions(['PERMISSION_READ']);
      const req = {
        securityContext: {
          rbac: {
            permissions: [],
            decisions: [],
          },
          resource: {},
        },
      };
      const res = {};

      await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
        status: HTTP_STATUS.NOT_FOUND,
        detail: ERRORS.FILE_NOT_FOUND,
      });
    });

    describe('draft file access', () => {
      it('should allow when API user file access is approved', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [
                {
                  predicate: PREDICATES.API_USER_FILE_ACCESS,
                  result: true,
                },
              ],
            },
            resource: {
              file: {
                id: 'file-123',
                createdBy: 'user-456',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });

      it('should allow when current user is the uploader', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          currentUser: {
            id: 'user-123',
          },
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [],
            },
            resource: {
              file: {
                id: 'file-123',
                createdBy: 'user-123',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });

      it('should allow when form is public', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [],
            },
            resource: {
              publicForm: true,
              file: {
                id: 'file-123',
                createdBy: 'user-456',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });

      it('should deny when user is not uploader and form is not public', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          currentUser: {
            id: 'user-789',
          },
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [],
            },
            resource: {
              publicForm: false,
              file: {
                id: 'file-123',
                createdBy: 'user-123',
              },
            },
          },
        };
        const res = {};

        await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
          status: HTTP_STATUS.FORBIDDEN,
          detail: ERRORS.UNAUTHORIZED_FILE_UPLOADER,
        });
      });

      it('should allow when API user draft file read is approved (GET request, e.g., webcomponents classification)', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          method: 'GET',
          currentUser: {
            id: 'user-789',
          },
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [
                {
                  predicate: PREDICATES.API_USER_DRAFT_FILE_READ,
                  result: true,
                },
              ],
            },
            resource: {
              publicForm: false,
              file: {
                id: 'file-123',
                createdBy: 'user-123',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });

      it('should allow when API user draft file delete is approved (DELETE request, e.g., webcomponents classification)', async () => {
        const middleware = hasFilePermissions(['PERMISSION_UPDATE']);
        const req = {
          method: 'DELETE',
          currentUser: {
            id: 'user-789',
          },
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [
                {
                  predicate: PREDICATES.API_USER_DRAFT_FILE_DELETE,
                  result: true,
                },
              ],
            },
            resource: {
              publicForm: false,
              file: {
                id: 'file-123',
                createdBy: 'user-123',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });

      it('should allow API user draft file read even when user is not uploader and form is not public (GET request)', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          method: 'GET',
          currentUser: {
            id: 'user-789',
          },
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [
                {
                  predicate: PREDICATES.API_USER_DRAFT_FILE_READ,
                  result: true,
                  classification: 'webcomponents',
                },
              ],
            },
            resource: {
              publicForm: false,
              file: {
                id: 'file-123',
                createdBy: 'user-123',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });

      it('should allow API user draft file delete even when user is not uploader and form is not public (DELETE request)', async () => {
        const middleware = hasFilePermissions(['PERMISSION_UPDATE']);
        const req = {
          method: 'DELETE',
          currentUser: {
            id: 'user-789',
          },
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [
                {
                  predicate: PREDICATES.API_USER_DRAFT_FILE_DELETE,
                  result: true,
                  classification: 'webcomponents',
                },
              ],
            },
            resource: {
              publicForm: false,
              file: {
                id: 'file-123',
                createdBy: 'user-123',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });
    });

    describe('submitted file access', () => {
      it('should allow when API user file access is approved', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          securityContext: {
            rbac: {
              permissions: ['PERMISSION_READ'],
              decisions: [
                {
                  predicate: PREDICATES.API_USER_FILE_ACCESS,
                  result: true,
                },
              ],
            },
            resource: {
              file: {
                id: 'file-123',
                formSubmissionId: 'submission-456',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });

      it('should deny when public user submitted file access is denied', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          securityContext: {
            rbac: {
              permissions: ['PERMISSION_READ'],
              decisions: [
                {
                  predicate: PREDICATES.PUBLIC_USER_SUBMITTED_FILE_ACCESS,
                  result: false,
                },
              ],
            },
            resource: {
              file: {
                id: 'file-123',
                formSubmissionId: 'submission-456',
              },
            },
          },
        };
        const res = {};

        await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
          status: HTTP_STATUS.FORBIDDEN,
          detail: ERRORS.UNAUTHORIZED_FILE_ACCESS,
        });
      });

      it('should deny when API user file API access is denied', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          securityContext: {
            rbac: {
              permissions: ['PERMISSION_READ'],
              decisions: [
                {
                  predicate: PREDICATES.API_USER_FILE_API_ACCESS,
                  result: false,
                },
              ],
            },
            resource: {
              file: {
                id: 'file-123',
                formSubmissionId: 'submission-456',
              },
            },
          },
        };
        const res = {};

        await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
          status: HTTP_STATUS.FORBIDDEN,
          detail: ERRORS.FORBIDDEN,
        });
      });

      it('should allow when user has all required permissions', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ', 'PERMISSION_UPDATE']);
        const req = {
          securityContext: {
            rbac: {
              permissions: ['PERMISSION_READ', 'PERMISSION_UPDATE', 'PERMISSION_DELETE'],
              decisions: [],
            },
            resource: {
              file: {
                id: 'file-123',
                formSubmissionId: 'submission-456',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });

      it('should deny when user is missing required permissions', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ', 'PERMISSION_UPDATE']);
        const req = {
          securityContext: {
            rbac: {
              permissions: ['PERMISSION_READ'],
              decisions: [],
            },
            resource: {
              file: {
                id: 'file-123',
                formSubmissionId: 'submission-456',
              },
            },
          },
        };
        const res = {};

        await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
          status: HTTP_STATUS.FORBIDDEN,
          detail: ERRORS.MISSING_FILE_PERMISSIONS,
          missing: ['PERMISSION_UPDATE'],
          required: ['PERMISSION_READ', 'PERMISSION_UPDATE'],
          granted: ['PERMISSION_READ'],
        });
      });

      it('should deny when user has no permissions', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ']);
        const req = {
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [],
            },
            resource: {
              file: {
                id: 'file-123',
                formSubmissionId: 'submission-456',
              },
            },
          },
        };
        const res = {};

        await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
          status: HTTP_STATUS.FORBIDDEN,
          detail: ERRORS.MISSING_FILE_PERMISSIONS,
          missing: ['PERMISSION_READ'],
        });
      });

      it('should handle empty required permissions array', async () => {
        const middleware = hasFilePermissions([]);
        const req = {
          securityContext: {
            rbac: {
              permissions: [],
              decisions: [],
            },
            resource: {
              file: {
                id: 'file-123',
                formSubmissionId: 'submission-456',
              },
            },
          },
        };
        const res = {};

        await callMiddleware(middleware, req, res);
      });

      it('should check all permissions when multiple are required', async () => {
        const middleware = hasFilePermissions(['PERMISSION_READ', 'PERMISSION_UPDATE', 'PERMISSION_DELETE']);
        const req = {
          securityContext: {
            rbac: {
              permissions: ['PERMISSION_READ', 'PERMISSION_UPDATE'],
              decisions: [],
            },
            resource: {
              file: {
                id: 'file-123',
                formSubmissionId: 'submission-456',
              },
            },
          },
        };
        const res = {};

        await expect(callMiddleware(middleware, req, res)).rejects.toMatchObject({
          status: HTTP_STATUS.FORBIDDEN,
          missing: ['PERMISSION_DELETE'],
        });
      });
    });
  });
});
