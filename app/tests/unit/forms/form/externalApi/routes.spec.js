const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../../common/helper');

const apiAccess = require('../../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');
const rateLimiter = require('../../../../../src/forms/common/middleware/rateLimiter');
const validateParameter = require('../../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../../src/forms/form/externalApi/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//
//
// mock middleware
//
const jwtService = require('../../../../../src/components/jwtService');

//
// test assumes that caller has appropriate token, we are not testing middleware here...
//
jwtService.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

jest.mock('../../../../../src/forms/auth/middleware/apiAccess');
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

validateParameter.validateFormId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateExternalAPIId = jest.fn((_req, _res, next) => {
  next();
});
const formId = uuid.v4();

//
// Create the router and a simple Express server.
//

const router = require('../../../../../src/forms/form/externalApi/routes');
const basePath = '/form';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/:formId/externalAPIs`, () => {
  const path = `${basePath}/${formId}/externalAPIs`;
  controller.listExternalAPIs = jest.fn((_req, _res, next) => {
    next();
  });
  controller.createExternalAPI = jest.fn((_req, _res, next) => {
    next();
  });

  it('should return 404 for DELETE', async () => {
    const response = await appRequest.delete(path);

    expect(response.statusCode).toBe(404);
  });

  it('should return 404 for PUT', async () => {
    const response = await appRequest.put(path);

    expect(response.statusCode).toBe(404);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(controller.listExternalAPIs).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(controller.createExternalAPI).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/externalAPIs/:externalAPIId`, () => {
  const externalAPIId = uuid.v4();
  const path = `${basePath}/${formId}/externalAPIs/${externalAPIId}`;
  controller.updateExternalAPI = jest.fn((_req, _res, next) => {
    next();
  });
  controller.deleteExternalAPI = jest.fn((_req, _res, next) => {
    next();
  });

  it('should return 404 for POST', async () => {
    const response = await appRequest.post(path);

    expect(response.statusCode).toBe(404);
  });

  it('should return 404 for GET', async () => {
    const response = await appRequest.get(path);

    expect(response.statusCode).toBe(404);
  });

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateExternalAPIId).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.updateExternalAPI).toBeCalledTimes(1);
  });

  it('hould have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateExternalAPIId).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.deleteExternalAPI).toBeCalledTimes(1);
  });
});
