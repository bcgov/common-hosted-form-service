const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const jwtService = require('../../../../src/components/jwtService');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const validateParameter = require('../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../src/forms/formModule/controller');

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

validateParameter.validateFormModuleId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormModuleVersionId = jest.fn((_req, _res, next) => {
  next();
});

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/formModule/routes');
const basePath = '/form_modules';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

const formModuleId = uuid.v4();
const formModuleVersionId = uuid.v4();

describe(`${basePath}`, () => {
  it('should call listFormModules for GET /', async () => {
    jest.spyOn(controller, 'listFormModules').mockImplementation((_req, res) => res.sendStatus(200));
    await appRequest.get(basePath);
    expect(controller.listFormModules).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
  });

  it('should call createFormModule for POST /', async () => {
    jest.spyOn(controller, 'createFormModule').mockImplementation((_req, res) => res.sendStatus(201));
    await appRequest.post(basePath);
    expect(controller.createFormModule).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formModuleId`, () => {
  const path = `${basePath}/${formModuleId}`;

  it('should call readFormModule for GET', async () => {
    controller.readFormModule = jest.fn((_req, res) => res.sendStatus(200));
    await appRequest.get(path);
    expect(controller.readFormModule).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
  });

  it('should call updateFormModule for PUT', async () => {
    controller.updateFormModule = jest.fn((_req, res) => res.sendStatus(200));
    await appRequest.put(path);
    expect(controller.updateFormModule).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
  });

  it('should call toggleFormModule for POST /toggle', async () => {
    controller.toggleFormModule = jest.fn((_req, res) => res.sendStatus(200));
    await appRequest.post(`${path}/toggle`);
    expect(controller.toggleFormModule).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formModuleId/version`, () => {
  const path = `${basePath}/${formModuleId}/version`;

  it('should call listFormModuleVersions for GET', async () => {
    controller.listFormModuleVersions = jest.fn((_req, res) => res.sendStatus(200));
    await appRequest.get(path);
    expect(controller.listFormModuleVersions).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
  });

  it('should call createFormModuleVersion for POST', async () => {
    controller.createFormModuleVersion = jest.fn((_req, res) => res.sendStatus(200));
    await appRequest.post(path);
    expect(controller.createFormModuleVersion).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formModuleId/version/:formModuleVersionId`, () => {
  const path = `${basePath}/${formModuleId}/version/${formModuleVersionId}`;

  it('should call readFormModuleVersion for GET', async () => {
    controller.readFormModuleVersion = jest.fn((_req, res) => res.sendStatus(200));
    await appRequest.get(path);
    expect(controller.readFormModuleVersion).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
  });

  it('should call updateFormModuleVersion for PUT', async () => {
    controller.updateFormModuleVersion = jest.fn((_req, res) => res.sendStatus(200));
    await appRequest.put(path);
    expect(controller.updateFormModuleVersion).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formModuleId/idp`, () => {
  const path = `${basePath}/${formModuleId}/idp`;

  it('should call listFormModuleIdentityProviders for GET', async () => {
    controller.listFormModuleIdentityProviders = jest.fn((_req, res) => res.sendStatus(200));
    await appRequest.get(path);
    expect(controller.listFormModuleIdentityProviders).toHaveBeenCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
  });
});
