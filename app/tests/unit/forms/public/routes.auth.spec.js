const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

//
// Unlike routes.spec.js (which mocks the middleware to test wiring), this suite
// exercises the REAL checkApiKey middleware to lock down the auth behaviour of
// the system-only /reminder route. Only the controller is stubbed.
//
const controller = require('../../../../src/forms/public/controller');
controller.sendReminderToSubmitter = jest.fn((_req, res) => {
  res.sendStatus(200);
});

const router = require('../../../../src/forms/public/routes');
const basePath = '/public';
const appRequest = request(expressHelper(basePath, router));

const path = `${basePath}/reminder`;

let savedToken;
beforeAll(() => {
  savedToken = process.env.APITOKEN;
  process.env.APITOKEN = uuid.v4();
});

afterAll(() => {
  process.env.APITOKEN = savedToken;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe(`GET ${path} auth`, () => {
  it('401s when no credentials are sent', async () => {
    const response = await appRequest.get(path);

    expect(response.status).toBe(401);
    expect(controller.sendReminderToSubmitter).not.toBeCalled();
  });

  it('401s when only an Authorization header is sent (no apikey bypass)', async () => {
    const response = await appRequest.get(path).set({ authorization: 'Bearer some-token' });

    expect(response.status).toBe(401);
    expect(controller.sendReminderToSubmitter).not.toBeCalled();
  });

  it('401s when the apikey does not match', async () => {
    const response = await appRequest.get(path).set({ apikey: uuid.v4() });

    expect(response.status).toBe(401);
    expect(controller.sendReminderToSubmitter).not.toBeCalled();
  });

  it('200s when a matching apikey is sent', async () => {
    const response = await appRequest.get(path).set({ apikey: process.env.APITOKEN });

    expect(response.status).toBe(200);
    expect(controller.sendReminderToSubmitter).toBeCalledTimes(1);
  });
});
