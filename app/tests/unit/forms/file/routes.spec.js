const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const apiAccess = require('../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const validateParameter = require('../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../src/forms/file/controller');
const filePermissions = require('../../../../src/forms/file/middleware/filePermissions');
const upload = require('../../../../src/forms/file/middleware/upload');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

jest.mock('../../../../src/forms/auth/middleware/apiAccess');
apiAccess.mockImplementation(
  jest.fn((_req, _res, next) => {
    next();
  })
);

filePermissions.currentFileRecord = jest.fn((_req, _res, next) => {
  next();
});
filePermissions.hasFileCreate = jest.fn((_req, _res, next) => {
  next();
});
const hasFilePermissionsMock = jest.fn((_req, _res, next) => {
  next();
});
filePermissions.hasFilePermissions = jest.fn(() => {
  return hasFilePermissionsMock;
});

upload.fileUpload.upload = jest.fn((_req, _res, next) => {
  next();
});

userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});

validateParameter.validateFileId = jest.fn((_req, _res, next) => {
  next();
});

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/file/routes');
const basePath = '/files';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}`, () => {
  const path = `${basePath}`;

  it('should have correct middleware for POST', async () => {
    controller.create = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.create).toBeCalledTimes(1);
    expect(filePermissions.currentFileRecord).toBeCalledTimes(0);
    expect(filePermissions.hasFileCreate).toBeCalledTimes(1);
    expect(hasFilePermissionsMock).toBeCalledTimes(0);
    expect(upload.fileUpload.upload).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFileId).toBeCalledTimes(0);
  });
});

describe(`${basePath}/:id`, () => {
  const fileId = uuid.v4();
  const path = `${basePath}/${fileId}`;

  it('should have correct middleware for DELETE', async () => {
    controller.delete = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.delete(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.delete).toBeCalledTimes(1);
    expect(filePermissions.currentFileRecord).toBeCalledTimes(1);
    expect(filePermissions.hasFileCreate).toBeCalledTimes(0);
    expect(hasFilePermissionsMock).toBeCalledTimes(1);
    expect(upload.fileUpload.upload).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFileId).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    controller.read = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.read).toBeCalledTimes(1);
    expect(filePermissions.currentFileRecord).toBeCalledTimes(1);
    expect(filePermissions.hasFileCreate).toBeCalledTimes(0);
    expect(hasFilePermissionsMock).toBeCalledTimes(1);
    expect(upload.fileUpload.upload).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFileId).toBeCalledTimes(1);
  });
});
