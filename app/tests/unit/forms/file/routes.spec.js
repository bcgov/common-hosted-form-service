const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

const { expressHelper } = require('../../../common/helper');

const apiAccess = require('../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const rateLimiter = require('../../../../src/forms/common/middleware/rateLimiter');
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

rateLimiter.apiKeyRateLimiter = jest.fn((_req, _res, next) => {
  next();
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

controller.create = jest.fn((_req, _res, next) => {
  next();
});
controller.delete = jest.fn((_req, _res, next) => {
  next();
});
controller.read = jest.fn((_req, _res, next) => {
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
    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(filePermissions.currentFileRecord).toBeCalledTimes(0);
    expect(filePermissions.hasFileCreate).toBeCalledTimes(1);
    expect(hasFilePermissionsMock).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(upload.fileUpload.upload).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(controller.create).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:id`, () => {
  const fileId = uuidv4();
  const path = `${basePath}/${fileId}`;

  it('should have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    // expect(validateParameter.validateFileId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(0);
    expect(filePermissions.currentFileRecord).toBeCalledTimes(1);
    expect(filePermissions.hasFileCreate).toBeCalledTimes(0);
    expect(hasFilePermissionsMock).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(upload.fileUpload.upload).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(controller.delete).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    // expect(validateParameter.validateFileId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(filePermissions.currentFileRecord).toBeCalledTimes(1);
    expect(filePermissions.hasFileCreate).toBeCalledTimes(0);
    expect(hasFilePermissionsMock).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(upload.fileUpload.upload).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(controller.read).toBeCalledTimes(1);
  });
});
