const request = require('supertest');

const { expressHelper } = require('../../../common/helper');

const jwtService = require('../../../../src/components/jwtService');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const validateParameter = require('../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../src/forms/permission/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

const mockJwtServiceProtect = jest.fn((_req, _res, next) => {
  next();
});
jwtService.protect = jest.fn(() => {
  return mockJwtServiceProtect;
});

userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});

validateParameter.validatePermissionCode = jest.fn((_req, _res, next) => {
  next();
});

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/permission/routes');
const basePath = '/permission';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

// jwtService.protect is tricky to test. This test is fragile as the file could
// change and have routes that need admin and others that don't. This test only
// works when we use(protect) at the file level, not individually in the routes.
// However, this does test that we don't accidentally turn off the protection.
describe('jwtService.protect', () => {
  it('should be called with admin', () => {
    jest.resetModules();
    const jwtService = require('../../../../src/components/jwtService');
    jwtService.protect = jest.fn(() => {
      return jest.fn((_req, _res, next) => {
        next();
      });
    });
    require('../../../../src/forms/permission/routes');

    expect(jwtService.protect).toBeCalledWith('admin');
  });
});

describe(`${basePath}`, () => {
  const path = `${basePath}`;

  it('should have correct middleware for GET', async () => {
    controller.list = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.list).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validatePermissionCode).toBeCalledTimes(0);
  });
});

describe(`${basePath}/:code`, () => {
  const path = `${basePath}/code`;

  it('should have correct middleware for GET', async () => {
    controller.read = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.read).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validatePermissionCode).toBeCalledTimes(1);
  });
});
