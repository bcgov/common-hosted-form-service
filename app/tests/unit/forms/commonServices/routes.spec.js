const request = require('supertest');

const { expressHelper } = require('../../../common/helper');

const controller = require('../../../../src/forms/commonServices/controller');

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/commonServices/routes');
const basePath = '/cs';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/css/idir/users`, () => {
  const path = `${basePath}/css/idir/users`;

  it('should have correct middleware for GET', async () => {
    controller.queryIdirUsers = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.queryIdirUsers).toBeCalledTimes(1);
  });
});
