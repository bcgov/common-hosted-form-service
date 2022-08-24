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
const service = require('../../../../src/forms/admin/service');
const userService = require('../../../../src/forms/user/service');
const rbacService = require('../../../../src/forms/rbac/service');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/admin/routes');

// Simple Express Server
const basePath = '/admin';
const app = expressHelper(basePath, router);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`GET ${basePath}/forms`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.listForms = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/forms`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.listForms = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/forms`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.listForms = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/forms`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/forms/formId`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.readForm = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/forms/formId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readForm = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/forms/formId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readForm = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/forms/formId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/forms/formId/restore`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.restoreForm = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/forms/formId/restore`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.restoreForm = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).put(`${basePath}/forms/formId/restore`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.restoreForm = jest.fn(() => { throw new Error(); });

    const response = await request(app).put(`${basePath}/forms/formId/restore`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

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

describe(`GET ${basePath}/users/userId`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    userService.read = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/users/userId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    userService.read = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/users/userId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    userService.read = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/users/userId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});


describe(`GET ${basePath}/forms/formId/formUsers`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.getFormUserRoles = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/forms/formId/formUsers`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.getFormUserRoles = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/forms/formId/formUsers`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.getFormUserRoles = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/forms/formId/formUsers`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/forms/formId/addUser`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    rbacService.setFormUsers = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/forms/formId/addUser`).query({ userId: '123' }).send({ userId: '123' });

    expect(rbacService.setFormUsers).toHaveBeenCalledWith('formId', '123', { userId: '123' }, undefined);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });


  it('should 422 if no userId is supplied', async () => {
    // mock an authentication/permission issue...
    rbacService.setFormUsers = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/forms/formId/addUser`).query({ val: 'Test1' }).send({ otherBody: '123' });

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    rbacService.setFormUsers = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).put(`${basePath}/forms/formId/addUser`).query({ userId: '123' }).send({ userId: '123' });

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    rbacService.setFormUsers = jest.fn(() => { throw new Error(); });

    const response = await request(app).put(`${basePath}/forms/formId/addUser`).query({ userId: '123' }).send({ userId: '123' });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});
