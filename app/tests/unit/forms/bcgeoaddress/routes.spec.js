const request = require('supertest');

const { expressHelper } = require('../../../common/helper');

const controller = require('../../../../src/forms/bcgeoaddress/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

controller.advanceSearchBCGeoAddress = jest.fn((_req, res) => {
  res.status(200).json({});
});
controller.searchBCGeoAddress = jest.fn((_req, res) => {
  res.status(200).json({});
});

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
    await appRequest.get(path);

    expect(controller.searchBCGeoAddress).toHaveBeenCalledTimes(1);
  });
});

describe(`${basePath}/advance/address`, () => {
  const path = `${basePath}/advance/address`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(controller.advanceSearchBCGeoAddress).toHaveBeenCalledTimes(1);
  });
});
