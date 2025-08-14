const request = require('supertest');

const { expressHelper } = require('../../../common/helper');

const controller = require('../../../../src/forms/css/controller');

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/css/routes');
const basePath = '/css';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/idir/users`, () => {
  const path = `${basePath}/idir/users`;

  it('should have correct middleware for GET', async () => {
    controller.queryIdirUsers = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.queryIdirUsers).toBeCalledTimes(1);
  });
});
