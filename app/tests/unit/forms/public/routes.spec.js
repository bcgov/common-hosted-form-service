const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const controller = require('../../../../src/forms/public/controller');

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

// TODO - move code out of the route and into middleware or the controller. The
// tests should continue to pass, but should themselves be moved into the
// middleware or controller tests.

describe(`${basePath}/reminder`, () => {
  const path = `${basePath}/reminder`;

  controller.sendReminderToSubmitter = jest.fn((_req, res) => {
    res.sendStatus(200);
  });

  it('200s when the APITOKEN matches apiKey', async () => {
    process.env.APITOKEN = uuid.v4();

    const response = await appRequest.get(path).set({ apikey: process.env.APITOKEN });

    expect(controller.sendReminderToSubmitter).toBeCalledTimes(1);
    expect(response.status).toBe(200);
  });

  // This is testing some strange code. Refactor the code and get rid of this.
  it('401s when there is no APITOKEN or apiKey', async () => {
    process.env.APITOKEN = '';

    const response = await appRequest.get(path).set({ apikey: process.env.APITOKEN });

    expect(controller.sendReminderToSubmitter).toBeCalledTimes(0);
    expect(response.status).toBe(401);
  });

  it('401s when the apiKey is empty', async () => {
    process.env.APITOKEN = uuid.v4();

    const response = await appRequest.get(path).set({ apikey: '' });

    expect(controller.sendReminderToSubmitter).toBeCalledTimes(0);
    expect(response.status).toBe(401);
  });

  it('401s when the apiKey exists but does not match', async () => {
    process.env.APITOKEN = uuid.v4();

    const response = await appRequest.get(path).set({ apikey: uuid.v4() });

    expect(controller.sendReminderToSubmitter).toBeCalledTimes(0);
    expect(response.status).toBe(401);
  });

  // Ideally the code should be refactored to not create the 404 and let Express
  // do it. Then this test should still pass.
  it('404s on a non-GET', async () => {
    const response = await appRequest.post(path);

    expect(controller.sendReminderToSubmitter).toBeCalledTimes(0);
    expect(response.status).toBe(404);
  });
});
