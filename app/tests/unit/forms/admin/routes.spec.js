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
    controller.getExternalAPIs = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getExternalAPIs).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/externalAPIs/:externalApiId`, () => {
  const externalApiId = uuid.v4();
  const path = `${basePath}/externalAPIs/${externalApiId}`;

  it('should have correct middleware for PUT', async () => {
    controller.updateExternalAPI = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(controller.updateExternalAPI).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/externalAPIs/statusCodes`, () => {
  const path = `${basePath}/externalAPIs/statusCodes`;

  it('should have correct middleware for GET', async () => {
    controller.getExternalAPIStatusCodes = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getExternalAPIStatusCodes).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/:publishStatus/:componentId`, () => {
  const componentId = uuid.v4();
  const path = `${basePath}/formcomponents/proactivehelp/:publishStatus/${componentId}`;

  it('should have correct middleware for PUT', async () => {
    controller.updateFormComponentsProactiveHelp = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(controller.updateFormComponentsProactiveHelp).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/imageUrl/:componentId`, () => {
  const componentId = uuid.v4();
  const path = `${basePath}/formcomponents/proactivehelp/imageUrl/${componentId}`;

  it('should have correct middleware for GET', async () => {
    controller.getFCProactiveHelpImageUrl = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getFCProactiveHelpImageUrl).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/list`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/list`;

  it('should have correct middleware for GET', async () => {
    controller.listFormComponentsProactiveHelp = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.listFormComponentsProactiveHelp).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/object`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/object`;

  it('should have correct middleware for POST', async () => {
    controller.createFormComponentsProactiveHelp = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(controller.createFormComponentsProactiveHelp).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/forms`, () => {
  const path = `${basePath}/forms`;

  it('should have correct middleware for GET', async () => {
    controller.listForms = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.listForms).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/forms/${formId}`;

  it('should have correct middleware for GET', async () => {
    controller.readForm = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.readForm).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/addUser`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/forms/${formId}/addUser`;

  it('should have correct middleware for PUT', async () => {
    controller.setFormUserRoles = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(controller.setFormUserRoles).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/apiKey`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/forms/${formId}/apiKey`;

  it('should have correct middleware for DELETE', async () => {
    controller.deleteApiKey = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.delete(path);

    expect(controller.deleteApiKey).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    controller.readApiDetails = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.readApiDetails).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/formUsers`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/forms/${formId}/formUsers`;

  it('should have correct middleware for GET', async () => {
    controller.getFormUserRoles = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getFormUserRoles).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/restore`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/forms/${formId}/restore`;

  it('should have correct middleware for PUT', async () => {
    controller.restoreForm = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(controller.restoreForm).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/forms/:formId/versions/:formVersionId`, () => {
  const formId = uuid.v4();
  const formVersionId = uuid.v4();
  const path = `${basePath}/forms/${formId}/versions/${formVersionId}`;

  it('should have correct middleware for GET', async () => {
    controller.readVersion = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.readVersion).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/users`, () => {
  const path = `${basePath}/users`;

  it('should have correct middleware for GET', async () => {
    controller.getUsers = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getUsers).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
  });
});

describe(`${basePath}/users/:userId`, () => {
  const userId = uuid.v4();
  const path = `${basePath}/users/${userId}`;

  it('should have correct middleware for GET', async () => {
    userController.read = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userController.read).toBeCalledTimes(1);
  });
});
