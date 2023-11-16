const request = require('supertest');
const Problem = require('api-problem');

const { expressHelper } = require('../../../common/helper');

//
// mock middleware
//
const keycloak = require('../../../../src/components/keycloak');

//
// test assumes that caller has appropriate token, we are not testing middleware here...
//
keycloak.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});
userAccess.hasFormPermissions = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});
userAccess.hasFormRoles = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});
userAccess.hasRolePermissions = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});
userAccess.hasSubmissionPermissions = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

//
// we will mock the underlying data service calls...
//
const service = require('../../../../src/forms/rbac/service');

const emailService = require('../../../../src/forms/email/emailService');
const submissionService = require('../../../../src/forms/submission/service');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/rbac/routes');

// Simple Express Server
const basePath = '/rbac';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/current`, () => {
  const path = `${basePath}/current`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getCurrentUser = jest.fn().mockReturnValue({});

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getCurrentUser = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getCurrentUser = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/current/submissions`, () => {
  const path = `${basePath}/current/submissions`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getCurrentUserSubmissions = jest.fn().mockReturnValue({});

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getCurrentUserSubmissions = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getCurrentUserSubmissions = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/idps`, () => {
  const path = `${basePath}/idps`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getIdentityProviders = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getIdentityProviders = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getIdentityProviders = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/forms`, () => {
  const path = `${basePath}/forms`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getFormUsers = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getFormUsers = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getFormUsers = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.setFormUsers = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.setFormUsers = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.setFormUsers = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/submissions`, () => {
  const path = `${basePath}/submissions`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getSubmissionUsers = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getSubmissionUsers = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getSubmissionUsers = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.modifySubmissionUser = jest.fn().mockReturnValue([]);
      emailService.submissionAssigned = jest.fn().mockReturnValue([]);
      emailService.submissionUnassigned = jest.fn().mockReturnValue([]);
      submissionService.read = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.modifySubmissionUser = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.modifySubmissionUser = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/users`, () => {
  const path = `${basePath}/users`;

  describe('DELETE', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.removeMultiUsers = jest.fn().mockReturnValue({});

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.removeMultiUsers = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.removeMultiUsers = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getUserForms = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getUserForms = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getUserForms = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.setUserForms = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.setUserForms = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.setUserForms = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});
