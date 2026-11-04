const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../../common/helper');

const jwtService = require('../../../../../src/components/jwtService');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');
const validateParameter = require('../../../../../src/forms/common/middleware/validateParameter');
const P = require('../../../../../src/forms/common/constants').Permissions;
const controller = require('../../../../../src/forms/form/webcomponentSettings/controller');

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

const router = require('../../../../../src/forms/form/webcomponentSettings/routes');
// Permissions are set when the routes are defined, so capture them before mocks are cleared
const routePermissions = userAccess.hasFormPermissions.mock.calls.map((call) => call[0]);
const basePath = '/form';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/:formId/webcomponentSettings`, () => {
  const formId = uuid.v4();
  const path = `${basePath}/${formId}/webcomponentSettings`;

  it('requires form update to view or change the settings', () => {
    expect(routePermissions).toEqual([
      [P.FORM_READ, P.FORM_UPDATE],
      [P.FORM_READ, P.FORM_UPDATE],
    ]);
  });

  it('should have correct middleware for GET', async () => {
    controller.readWebcomponentSettings = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.readWebcomponentSettings).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });

  it('should have correct middleware for PUT', async () => {
    controller.upsertWebcomponentSettings = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(controller.upsertWebcomponentSettings).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
  });
});
