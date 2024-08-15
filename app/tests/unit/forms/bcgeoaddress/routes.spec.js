const request = require('supertest');

const { expressHelper } = require('../../../common/helper');

const controller = require('../../../../src/forms/bcgeoaddress/controller');

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/bcgeoaddress/routes');
const basePath = '/bcgeoaddress';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/address`, () => {
  const path = `${basePath}/address`;

  it('should have correct middleware for GET', async () => {
    controller.searchBCGeoAddress = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.searchBCGeoAddress).toBeCalledTimes(1);
  });
});

describe(`${basePath}/advance/address`, () => {
  const path = `${basePath}/advance/address`;

  it('should have correct middleware for GET', async () => {
    controller.advanceSearchBCGeoAddress = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(controller.advanceSearchBCGeoAddress).toBeCalledTimes(1);
  });
});
