const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const jwtService = require('../../../../src/components/jwtService');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const validateParameter = require('../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../src/forms/user/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

jwtService.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});

validateParameter.validateFormId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateUserId = jest.fn((_req, _res, next) => {
  next();
});

// Mock the controller functions with happy path results.

controller.deleteUserFormPreferences = jest.fn((_req, res) => {
  res.sendStatus(204);
});
controller.deleteUserPreferences = jest.fn((_req, res) => {
  res.sendStatus(204);
});
controller.list = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.read = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.readUserFormPreferences = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.readUserLabels = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.readUserPreferences = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.updateUserFormPreferences = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.updateUserLabels = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.updateUserPreferences = jest.fn((_req, res) => {
  res.status(200).json({});
});

const formId = uuid.v4();
const userId = uuid.v4();

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/user/routes');
const basePath = '/users';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/`, () => {
  const path = `${basePath}/`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateUserId).toBeCalledTimes(0);
    expect(controller.list).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:userId`, () => {
  const path = `${basePath}/${userId}`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateUserId).toBeCalledTimes(1);
    expect(controller.read).toBeCalledTimes(1);
  });
});

describe(`${basePath}/labels`, () => {
  const path = `${basePath}/labels`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateUserId).toBeCalledTimes(0);
    expect(controller.readUserLabels).toBeCalledTimes(1);
  });

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateUserId).toBeCalledTimes(0);
    expect(controller.updateUserLabels).toBeCalledTimes(1);
  });
});

describe(`${basePath}/preferences`, () => {
  const path = `${basePath}/preferences`;

  it('should have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateUserId).toBeCalledTimes(0);
    expect(controller.deleteUserPreferences).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateUserId).toBeCalledTimes(0);
    expect(controller.readUserPreferences).toBeCalledTimes(1);
  });

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateUserId).toBeCalledTimes(0);
    expect(controller.updateUserPreferences).toBeCalledTimes(1);
  });
});

describe(`${basePath}/preferences/forms/:formId`, () => {
  const path = `${basePath}/preferences/forms/${formId}`;

  it('should have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateUserId).toBeCalledTimes(0);
    expect(controller.deleteUserFormPreferences).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateUserId).toBeCalledTimes(0);
    expect(controller.readUserFormPreferences).toBeCalledTimes(1);
  });

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateUserId).toBeCalledTimes(0);
    expect(controller.updateUserFormPreferences).toBeCalledTimes(1);
  });
});
