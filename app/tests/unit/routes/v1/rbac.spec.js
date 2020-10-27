const request = require('supertest');
const Problem = require('api-problem');

const helper = require('../../../common/helper');

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
const service = require('../../../../src/forms/rbac/service');


//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/rbac/routes');

// Simple Express Server
const basePath = '/rbac';
const app = helper.expressHelper(basePath, router);
helper.logHelper();

afterEach(() => {
  jest.clearAllMocks();
});

describe(`GET ${basePath}/current`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.getCurrentUser = jest.fn().mockReturnValue({});

    const response = await request(app).get(`${basePath}/current`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.getCurrentUser = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/current`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.getCurrentUser = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/current`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/idps`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.getIdentityProviders = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/idps`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.getIdentityProviders = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/idps`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.getIdentityProviders = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/idps`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

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
    service.list = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.list = jest.fn(() => { throw new Error(); });

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
    service.create = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.create = jest.fn(() => { throw new Error(); });

    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/FormRoleUser`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.read = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/FormRoleUser`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.read = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/FormRoleUser`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.read = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/FormRoleUser`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/FormRoleUser`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.update = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/FormRoleUser`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.update = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).put(`${basePath}/FormRoleUser`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.update = jest.fn(() => { throw new Error(); });

    const response = await request(app).put(`${basePath}/FormRoleUser`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`DELETE ${basePath}/FormRoleUser`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.delete = jest.fn().mockReturnValue(true);

    const response = await request(app).delete(`${basePath}/FormRoleUser`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.delete = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).delete(`${basePath}/FormRoleUser`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.delete = jest.fn(() => { throw new Error(); });

    const response = await request(app).delete(`${basePath}/FormRoleUser`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/forms`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.getFormUsers = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/forms`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.getFormUsers = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/forms`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.getFormUsers = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/forms`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/forms`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.setFormUsers = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/forms`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.setFormUsers = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).put(`${basePath}/forms`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.setFormUsers = jest.fn(() => { throw new Error(); });

    const response = await request(app).put(`${basePath}/forms`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/users`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.getUserForms = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/users`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.getUserForms = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/users`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.getUserForms = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/users`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/users`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.setUserForms = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/users`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.setUserForms = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).put(`${basePath}/users`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.setUserForms = jest.fn(() => { throw new Error(); });

    const response = await request(app).put(`${basePath}/users`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});
