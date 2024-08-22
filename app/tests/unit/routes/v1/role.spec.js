const request = require('supertest');
const Problem = require('api-problem');

const jwtService = require('../../../../src/components/jwtService');
const { expressHelper } = require('../../../common/helper');
const constants = require('../../../../src/forms/common/constants');

//
// mock middleware
//

jwtService.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});

//
// we will mock the underlying data service calls...
//
const service = require('../../../../src/forms/role/service');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/role/routes');

// Simple Express Server
const basePath = '/roles';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}`, () => {
  const path = `${basePath}`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.list = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.list = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.list = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('POST', () => {
    it('should return 201', async () => {
      // mock a success return value...
      service.create = jest.fn().mockReturnValue({});

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(201);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.create = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.create = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:code`, () => {
  const path = `${basePath}/${constants.Roles.FORM_DESIGNER}`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.read = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.read = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.read = jest.fn(() => {
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
      service.update = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.update = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.update = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});
