const request = require('supertest');
const Problem = require('api-problem');

const helper = require('../../../common/helper');

//
// mock middleware
//
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
userAccess.currentUser = jest.fn((req, res, next) => {
  next();
});

//
// we will mock the underlying data service calls...
//
const service = require('../../../../src/forms/submission/service');


//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/submission/routes');


// Simple Express Server
const basePath = '/submissions';
const app = helper.expressHelper(basePath, router);
helper.logHelper();

afterEach(() => {
  jest.clearAllMocks();
});

describe(`GET ${basePath}/ID`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.read = jest.fn().mockReturnValue({});

    const response = await request(app).get(`${basePath}/ID`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.read = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/ID`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.read = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/ID`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`PUT ${basePath}/ID`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.update = jest.fn().mockReturnValue({});

    const response = await request(app).put(`${basePath}/ID`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.update = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).put(`${basePath}/ID`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error.
    service.update = jest.fn(() => { throw new Error(); });

    const response = await request(app).put(`${basePath}/ID`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});
