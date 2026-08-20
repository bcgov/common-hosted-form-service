const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../../common/helper');

const jwtService = require('../../../../../src/components/jwtService');
const apiAccess = require('../../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');
const validateParameter = require('../../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../../src/forms/form/documentTemplate/controller');

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

validateParameter.validateDocumentTemplateId = jest.fn((_req, _res, next) => {
  next();
});

//
// Create the router and a simple Express server.
//

const router = require('../../../../../src/forms/form/documentTemplate/routes');
const basePath = '/form';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/:formId/documentTemplates`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/${formId}/documentTemplates`;

  it('should have correct middleware for GET', async () => {
    controller.documentTemplateList = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.documentTemplateList).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
  });

  it('should have correct middleware for POST', async () => {
    controller.documentTemplateCreate = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.documentTemplateCreate).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
  });
});

describe(`${basePath}/:formId/documentTemplates/:documentTemplateId`, () => {
  const documentTemplateId = uuid.v4();
  const formId = uuid.v4();
  const path = `${basePath}/${formId}/documentTemplates/${documentTemplateId}`;

  it('should have correct middleware for GET', async () => {
    controller.documentTemplateRead = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.documentTemplateRead).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(1);
  });

  it('should have correct middleware for DELETE', async () => {
    controller.documentTemplateDelete = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.delete(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.documentTemplateDelete).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(1);
  });
});
