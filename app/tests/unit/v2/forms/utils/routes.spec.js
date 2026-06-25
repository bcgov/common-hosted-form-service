const request = require('supertest');

const { expressHelper } = require('../../../../common/helper');

const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');
const requireCdogsV3Access = require('../../../../../src/v2/forms/submission/middleware/requireCdogsV3Access');
const controller = require('../../../../../src/v2/forms/submission/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

userAccess.currentUser = jest.fn((_req, _res, next) => {
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

const router = require('../../../../../src/v2/forms/utils/routes');
const basePath = '/utils';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/template/render`, () => {
  const path = `${basePath}/template/render`;

  it('should have correct middleware for POST', async () => {
    controller.draftTemplateUploadAndRender = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(controller.draftTemplateUploadAndRender).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(requireCdogsV3Access).toBeCalledTimes(1);
  });
});
