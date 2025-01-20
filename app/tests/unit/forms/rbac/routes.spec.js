const request = require('supertest');

const { expressHelper } = require('../../../common/helper');

const jwtService = require('../../../../src/components/jwtService');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const controller = require('../../../../src/forms/rbac/controller');

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

const hasFormPermissionsMock = jest.fn((_req, _res, next) => {
  next();
});
const hasFormRolesMock = jest.fn((_req, _res, next) => {
  next();
});
const hasSubmissionPermissionsMock = jest.fn((_req, _res, next) => {
  next();
});
userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});
userAccess.filterMultipleSubmissions = jest.fn((_req, _res, next) => {
  next();
});
userAccess.hasFormPermissions = jest.fn(() => {
  return hasFormPermissionsMock;
});
userAccess.hasFormRoles = jest.fn(() => {
  return hasFormRolesMock;
});
userAccess.hasRoleDeletePermissions = jest.fn((_req, _res, next) => {
  next();
});
userAccess.hasRoleModifyPermissions = jest.fn((_req, _res, next) => {
  next();
});
userAccess.hasSubmissionPermissions = jest.fn(() => {
  return hasSubmissionPermissionsMock;
});

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/rbac/routes');
const basePath = '/rbac';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/current`, () => {
  const path = `${basePath}/current`;

  it('should have correct middleware for GET', async () => {
    controller.getCurrentUser = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getCurrentUser).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(hasFormRolesMock).toBeCalledTimes(0);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });
});

describe(`${basePath}/current/forms`, () => {
  const path = `${basePath}/current/forms`;

  it('should have correct middleware for GET', async () => {
    controller.getCurrentUserForms = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getCurrentUserForms).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(hasFormRolesMock).toBeCalledTimes(0);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });
});

describe(`${basePath}/current/submissions`, () => {
  const path = `${basePath}/current/submissions`;

  it('should have correct middleware for GET', async () => {
    controller.getCurrentUserSubmissions = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getCurrentUserSubmissions).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(hasFormRolesMock).toBeCalledTimes(0);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });
});

describe(`${basePath}/forms`, () => {
  const path = `${basePath}/forms`;

  it('should have correct middleware for GET', async () => {
    controller.getFormUsers = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getFormUsers).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(hasFormRolesMock).toBeCalledTimes(0);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });

  it('should have correct middleware for PUT', async () => {
    controller.setFormUsers = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(controller.setFormUsers).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(hasFormRolesMock).toBeCalledTimes(0);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });
});

describe(`${basePath}/idps`, () => {
  const path = `${basePath}/idps`;

  it('should have correct middleware for GET', async () => {
    controller.getIdentityProviders = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getIdentityProviders).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(hasFormRolesMock).toBeCalledTimes(0);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });
});

describe(`${basePath}/submissions`, () => {
  const path = `${basePath}/submissions`;

  it('should have correct middleware for GET', async () => {
    controller.getSubmissionUsers = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getSubmissionUsers).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(hasFormRolesMock).toBeCalledTimes(0);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });

  it('should have correct middleware for PUT', async () => {
    controller.setSubmissionUserPermissions = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(controller.setSubmissionUserPermissions).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(hasFormRolesMock).toBeCalledTimes(0);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });
});

describe(`${basePath}/users`, () => {
  const path = `${basePath}/users`;

  it('should have correct middleware for DELETE', async () => {
    controller.removeMultiUsers = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.delete(path);

    expect(controller.removeMultiUsers).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(hasFormRolesMock).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(1);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });

  it('should have correct middleware for GET', async () => {
    controller.getUserForms = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.getUserForms).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(hasFormRolesMock).toBeCalledTimes(0);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(mockJwtServiceProtect).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(0);
  });

  it('should have correct middleware for PUT', async () => {
    controller.setUserForms = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(controller.setUserForms).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(hasFormRolesMock).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(mockJwtServiceProtect).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.hasRoleDeletePermissions).toBeCalledTimes(0);
    expect(userAccess.hasRoleModifyPermissions).toBeCalledTimes(1);
  });
});
