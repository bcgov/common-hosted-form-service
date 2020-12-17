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
const service = require('../../../../src/forms/admin/service');
const userService = require('../../../../src/forms/user/service');


//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/admin/routes');

// Simple Express Server
const basePath = '/admin';
const app = helper.expressHelper(basePath, router);
helper.logHelper();

afterEach(() => {
  jest.clearAllMocks();
});

describe(`GET ${basePath}/users`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    userService.list = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/users`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    userService.list = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/users`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    userService.list = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/users`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formusers`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.getFormUserRoles = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/formusers`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.getFormUserRoles = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formusers`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.getFormUserRoles = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formusers`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/formusers`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.setFormUserRoles = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/formusers`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.setFormUserRoles = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).put(`${basePath}/formusers`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.setFormUserRoles = jest.fn(() => { throw new Error(); });

    const response = await request(app).put(`${basePath}/formusers`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});
