const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

const { expressHelper } = require('../../../common/helper');

const apiAccess = require('../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const rateLimiter = require('../../../../src/forms/common/middleware/rateLimiter');
const validateParameter = require('../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../src/forms/submission/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//
const jwtService = require('../../../../src/components/jwtService');

//
// test assumes that caller has appropriate token, we are not testing middleware here...
//
jwtService.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

jest.mock('../../../../src/forms/auth/middleware/apiAccess');
apiAccess.mockImplementation(
  jest.fn((_req, _res, next) => {
    next();
  })
);

controller.templateRender = jest.fn((_req, _res, next) => {
  next();
});

rateLimiter.apiKeyRateLimiter = jest.fn((_req, _res, next) => {
  next();
});

const hasSubmissionPermissionsMock = jest.fn((_req, _res, next) => {
  next();
});

userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});

userAccess.hasSubmissionPermissions = jest.fn(() => {
  return hasSubmissionPermissionsMock;
});

validateParameter.validateDocumentTemplateId = jest.fn((_req, _res, next) => {
  next();
});

const documentTemplateId = uuidv4();
const formSubmissionId = uuidv4();

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/submission/routes');
const basePath = '/submissions';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/:formSubmissionId/template/:documentTemplateId/render`, () => {
  const path = `${basePath}/${formSubmissionId}/template/${documentTemplateId}/render`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(controller.templateRender).toBeCalledTimes(1);
  });
});
