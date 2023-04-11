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
const service = require('../../../../src/forms/permission/service');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/permission/routes');

// Simple Express Server
const basePath = '/permissions';
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

describe(`POST ${basePath}`, () => {
  it('should return 201', async () => {
    // mock a success return value...
    service.create = jest.fn().mockReturnValue({});

    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.create = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.create = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/permissions`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.read = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/permissions`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.read = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).get(`${basePath}/permissions`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.read = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).get(`${basePath}/permissions`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`PUT ${basePath}/permissions`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.update = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/permissions`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.update = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).put(`${basePath}/permissions`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.update = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).put(`${basePath}/permissions`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});
