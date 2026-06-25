const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../../common/helper');

const apiAccess = require('../../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');
const validateParameter = require('../../../../../src/forms/common/middleware/validateParameter');
const requireCdogsV3Access = require('../../../../../src/v2/forms/submission/middleware/requireCdogsV3Access');
const controller = require('../../../../../src/v2/forms/submission/controller');

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

const hasSubmissionPermissionsMock = jest.fn((_req, _res, next) => {
  next();
});
userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});
userAccess.hasSubmissionPermissions = jest.fn(() => {
  return hasSubmissionPermissionsMock;
});

validateParameter.validateDocumentTemplateId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormSubmissionId = jest.fn((_req, _res, next) => {
  next();
});

jest.mock('../../../../../src/v2/forms/submission/middleware/requireCdogsV3Access');
requireCdogsV3Access.mockImplementation(
  jest.fn((_req, _res, next) => {
    next();
  })
);

//
// Create the router and a simple Express server.
//

const router = require('../../../../../src/v2/forms/submission/routes');
const basePath = '/submissions';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/:formSubmissionId/template/:documentTemplateId/render`, () => {
  const documentTemplateId = uuid.v4();
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/template/${documentTemplateId}/render`;

  it('should have correct middleware for GET', async () => {
    controller.templateRender = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.templateRender).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(1);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
    expect(requireCdogsV3Access).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/template/render`, () => {
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/template/render`;

  it('should have correct middleware for POST', async () => {
    controller.templateUploadAndRender = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.templateUploadAndRender).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
    expect(requireCdogsV3Access).toBeCalledTimes(1);
  });
});
