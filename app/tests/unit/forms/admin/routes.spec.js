const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const jwtService = require('../../../../src/components/jwtService');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const controller = require('../../../../src/forms/admin/controller');
const userController = require('../../../../src/forms/user/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

// TODO: Add a test the confirms that jwtService.protect is called with "admin"
// when the file is loaded.

const mockJwtServiceProtect = jest.fn((_req, _res, next) => {
  next();
});
jwtService.protect = jest.fn(() => {
  return mockJwtServiceProtect;
});

userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});

controller.createFormComponentsProactiveHelp = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.deleteApiKey = jest.fn((_req, res) => {
  res.sendStatus(204);
});
controller.getFormUserRoles = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.getExternalAPIs = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.getExternalAPIStatusCodes = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.getFCProactiveHelpImageUrl = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.getUsers = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.listFormComponentsProactiveHelp = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.listForms = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.readApiDetails = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.readForm = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.readVersion = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.restoreForm = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.setFormUserRoles = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.updateExternalAPI = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.updateFormComponentsProactiveHelp = jest.fn((_req, res) => {
  res.status(200).json({});
});
userController.read = jest.fn((_req, res) => {
  res.status(200).json({});
});

const componentId = uuid.v4();
const externalApiId = uuid.v4();
const formId = uuid.v4();
const formVersionId = uuid.v4();
const userId = uuid.v4();

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/admin/routes');
const basePath = '/admin';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/externalAPIs`, () => {
  const path = `${basePath}/externalAPIs`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.getExternalAPIs).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/externalAPIs/:externalApiId`, () => {
  const path = `${basePath}/externalAPIs/${externalApiId}`;

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.updateExternalAPI).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/externalAPIs/statusCodes`, () => {
  const path = `${basePath}/externalAPIs/statusCodes`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.getExternalAPIStatusCodes).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/:publishStatus/:componentId`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/:publishStatus/${componentId}`;

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.updateFormComponentsProactiveHelp).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/imageUrl/:componentId`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/imageUrl/${componentId}`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.getFCProactiveHelpImageUrl).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/list`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/list`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.listFormComponentsProactiveHelp).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/object`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/object`;

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.createFormComponentsProactiveHelp).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/forms`, () => {
  const path = `${basePath}/forms`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.listForms).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId`, () => {
  const path = `${basePath}/forms/${formId}`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.readForm).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/addUser`, () => {
  const path = `${basePath}/forms/${formId}/addUser`;

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.setFormUserRoles).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/apiKey`, () => {
  const path = `${basePath}/forms/${formId}/apiKey`;

  it('should have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.deleteApiKey).toHaveBeenCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.readApiDetails).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/formUsers`, () => {
  const path = `${basePath}/forms/${formId}/formUsers`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.getFormUserRoles).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/restore`, () => {
  const path = `${basePath}/forms/${formId}/restore`;

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.restoreForm).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/versions/:formVersionId`, () => {
  const path = `${basePath}/forms/${formId}/versions/${formVersionId}`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.readVersion).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/users`, () => {
  const path = `${basePath}/users`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(controller.getUsers).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/users/:userId`, () => {
  const path = `${basePath}/users/${userId}`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(mockJwtServiceProtect).toHaveBeenCalledTimes(1);
    expect(userAccess.currentUser).toHaveBeenCalledTimes(1);
    expect(userController.read).toHaveBeenCalledTimes(1);
  });
});
