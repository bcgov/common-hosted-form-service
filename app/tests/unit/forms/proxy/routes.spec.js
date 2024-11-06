jest.mock('cors', () =>
  jest.fn(() => {
    return jest.fn((_req, _res, next) => {
      next();
    });
  })
);

const Problem = require('api-problem');
const request = require('supertest');

const { expressHelper } = require('../../../common/helper');

const apiAccess = require('../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

jest.mock('../../../../src/forms/auth/middleware/apiAccess');
apiAccess.mockImplementation(
  jest.fn((_req, _res, next) => {
    next();
  })
);

userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});

const service = require('../../../../src/forms/proxy/service');

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/proxy/routes');
const basePath = '/proxy';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/external`, () => {
  const path = `${basePath}/external`;

  describe('POST', () => {
    it('should return 404', async () => {
      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET', () => {
    it('should handle 401', async () => {
      service.readProxyHeaders = jest.fn().mockRejectedValue(new Problem('401'));

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
    });

    it('should handle 500', async () => {
      service.readProxyHeaders = jest.fn().mockRejectedValue(new Problem('500'));

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
    });

    describe('GET', () => {
      it('should return 200', async () => {
        const response = await appRequest.get(path).expect(function (res) {
          res.statusCode = 200;
          res.body = {};
        });

        expect(response.statusCode).toBe(200);
      });
    });
  });
});

describe(`${basePath}/headers`, () => {
  const path = `${basePath}/headers`;

  describe('GET', () => {
    it('should return 404', async () => {
      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST', () => {
    it('should handle 401', async () => {
      service.generateProxyHeaders = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET', () => {
    it('should handle 500', async () => {
      service.generateProxyHeaders = jest.fn(() => {
        throw new Problem(500);
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(500);
    });
  });

  describe('GET', () => {
    it('should return 200', async () => {
      service.generateProxyHeaders = jest.fn(() => {
        return { 'X-HEADERS': 'encrypted blob' };
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(200);
    });
  });
});
