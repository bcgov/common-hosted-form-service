const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

const { expressHelper } = require('../../../common/helper');

const apiAccess = require('../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const rateLimiter = require('../../../../src/forms/common/middleware/rateLimiter');
const validateParameter = require('../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../src/forms/form/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//
//
// mock middleware
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

controller.documentTemplateCreate = jest.fn((_req, _res, next) => {
  next();
});
controller.documentTemplateDelete = jest.fn((_req, _res, next) => {
  next();
});
controller.documentTemplateList = jest.fn((_req, _res, next) => {
  next();
});
controller.documentTemplateRead = jest.fn((_req, _res, next) => {
  next();
});

rateLimiter.apiKeyRateLimiter = jest.fn((_req, _res, next) => {
  next();
});

const hasFormPermissionsMock = jest.fn((_req, _res, next) => {
  next();
});

userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});

userAccess.hasFormPermissions = jest.fn(() => {
  return hasFormPermissionsMock;
});

validateParameter.validateDocumentTemplateId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormId = jest.fn((_req, _res, next) => {
  next();
});

const documentTemplateId = uuidv4();
const formId = uuidv4();

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/form/routes');
const basePath = '/form';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/:formId/documentTemplates`, () => {
  const path = `${basePath}/${formId}/documentTemplates`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.documentTemplateList).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.documentTemplateCreate).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/documentTemplates/:documentTemplateId`, () => {
  const path = `${basePath}/${formId}/documentTemplates/${documentTemplateId}`;

  it('should have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.documentTemplateDelete).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.documentTemplateRead).toBeCalledTimes(1);
  });
});
