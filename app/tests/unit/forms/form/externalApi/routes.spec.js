const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../../common/helper');

const jwtService = require('../../../../../src/components/jwtService');
const apiAccess = require('../../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');
const validateParameter = require('../../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../../src/forms/form/externalApi/controller');

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

validateParameter.validateExternalAPIId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormId = jest.fn((_req, _res, next) => {
  next();
});

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
  const formId = uuid.v4();
  const path = `${basePath}/${formId}/externalAPIs`;

  it('should return 404 for DELETE', async () => {
    const response = await appRequest.delete(path);

    expect(response.statusCode).toBe(404);
  });

  it('should have correct middleware for GET', async () => {
    controller.listExternalAPIs = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.listExternalAPIs).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateExternalAPIId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    controller.createExternalAPI = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.createExternalAPI).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateExternalAPIId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });

  it('should return 404 for PUT', async () => {
    const response = await appRequest.put(path);

    expect(response.statusCode).toBe(404);
  });
});

describe(`${basePath}/:formId/externalAPIs/:externalAPIId`, () => {
  const formId = uuid.v4();
  const externalAPIId = uuid.v4();
  const path = `${basePath}/${formId}/externalAPIs/${externalAPIId}`;

  it('should have correct middleware for DELETE', async () => {
    controller.deleteExternalAPI = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.delete(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.deleteExternalAPI).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateExternalAPIId).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });

  it('should return 404 for GET', async () => {
    const response = await appRequest.get(path);

    expect(response.statusCode).toBe(404);
  });

  it('should return 404 for POST', async () => {
    const response = await appRequest.post(path);

    expect(response.statusCode).toBe(404);
  });

  it('should have correct middleware for PUT', async () => {
    controller.updateExternalAPI = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.updateExternalAPI).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateExternalAPIId).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/externalAPIs/algorithms`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/${formId}/externalAPIs/algorithms`;

  // TODO: This route is overloaded by the one that takes an externalApiId.
  it.skip('should return 404 for DELETE', async () => {
    const response = await appRequest.delete(path);

    expect(response.statusCode).toBe(404);
  });

  it('should have correct middleware for GET', async () => {
    controller.listExternalAPIAlgorithms = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateExternalAPIId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.listExternalAPIAlgorithms).toBeCalledTimes(1);
  });

  it('should return 404 for POST', async () => {
    const response = await appRequest.post(path);

    expect(response.statusCode).toBe(404);
  });

  // TODO: This route is overloaded by the one that takes an externalApiId.
  it.skip('should return 404 for PUT', async () => {
    const response = await appRequest.put(path);

    expect(response.statusCode).toBe(404);
  });
});

describe(`${basePath}/:formId/externalAPIs/statusCodes`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/${formId}/externalAPIs/statusCodes`;

  // TODO: This route is overloaded by the one that takes an externalApiId.
  it.skip('should return 404 for DELETE', async () => {
    const response = await appRequest.delete(path);

    expect(response.statusCode).toBe(404);
  });

  it('should have correct middleware for GET', async () => {
    controller.listExternalAPIStatusCodes = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.listExternalAPIStatusCodes).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateExternalAPIId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });

  it('should return 404 for POST', async () => {
    const response = await appRequest.post(path);

    expect(response.statusCode).toBe(404);
  });

  // TODO: This route is overloaded by the one that takes an externalApiId.
  it.skip('should return 404 for PUT', async () => {
    const response = await appRequest.put(path);

    expect(response.statusCode).toBe(404);
  });
});
