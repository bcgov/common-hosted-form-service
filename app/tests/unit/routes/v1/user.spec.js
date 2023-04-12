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
  return jest.fn((req, res, next) => {
    next();
  });
});

const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
userAccess.currentUser = jest.fn((req, res, next) => {
  next();
});

//
// we will mock the underlying data service calls...
//
const service = require('../../../../src/forms/user/service');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/user/routes');

// Simple Express Server
const basePath = '/users';
const app = expressHelper(basePath, router);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`GET ${basePath}`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.list = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.list = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.list = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/userId`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.readSafe = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/userId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readSafe = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).get(`${basePath}/userId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readSafe = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).get(`${basePath}/userId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});
