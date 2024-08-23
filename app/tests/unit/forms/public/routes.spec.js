const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const controller = require('../../../../src/forms/public/controller');
const apiAccess = require('../../../../src/forms/public/middleware/apiAccess');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

apiAccess.checkApiKey = jest.fn((_req, _res, next) => {
  next();
});

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/public/routes');
const basePath = '/public';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/reminder`, () => {
  const path = `${basePath}/reminder`;

  controller.sendReminderToSubmitter = jest.fn((_req, res) => {
    res.sendStatus(200);
  });

  it('200s when the APITOKEN matches apiKey', async () => {
    process.env.APITOKEN = uuid.v4();

    await appRequest.get(path).set({ apikey: process.env.APITOKEN });

    expect(apiAccess.checkApiKey).toBeCalledTimes(1);
    expect(controller.sendReminderToSubmitter).toBeCalledTimes(1);
  });
});
