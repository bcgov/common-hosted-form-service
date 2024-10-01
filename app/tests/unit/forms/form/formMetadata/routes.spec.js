const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../../common/helper');

const jwtService = require('../../../../../src/components/jwtService');
const apiAccess = require('../../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');
const rateLimiter = require('../../../../../src/forms/common/middleware/rateLimiter');
const validateParameter = require('../../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../../src/forms/form/formMetadata/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

jest.mock('../../../../../src/forms/auth/middleware/apiAccess');
apiAccess.mockImplementation(
  jest.fn((_req, _res, next) => {
    next();
  })
);

jwtService.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
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

//
// Create the router and a simple Express server.
//

const router = require('../../../../../src/forms/form/formMetadata/routes');
const basePath = '/form';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/:formId/formMetadata`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/${formId}/formMetadata`;

  it('should have correct middleware for DELETE', async () => {
    controller.delete = jest.fn((_req, res) => {
      res.sendStatus(204);
    });

    await appRequest.delete(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.delete).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    controller.read = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.read).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    controller.create = jest.fn((_req, res) => {
      res.sendStatus(201);
    });

    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.create).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    controller.update = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.update).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });
});
