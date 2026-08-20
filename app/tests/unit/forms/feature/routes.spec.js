const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const controller = require('../../../../src/forms/feature/controller');

//
// The GET endpoints are public read — intentionally no auth middleware. Feature
// configuration is mutated only via the admin module (admin-protected). The
// POST /submitToEmail/process endpoint is system-only (cron via apikey header).
//

const router = require('../../../../src/forms/feature/routes');
const basePath = '/features';
const app = expressHelper(basePath, router);
const appRequest = request(app);

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

describe(`${basePath}`, () => {
  it('GET calls controller.listFeatures with no auth gate', async () => {
    controller.listFeatures = jest.fn((_req, res) => res.sendStatus(200));

    const response = await appRequest.get(basePath);

    expect(controller.listFeatures).toBeCalledTimes(1);
    expect(response.status).toBe(200);
  });
});

describe(`${basePath}/check`, () => {
  it('GET calls controller.check with no auth gate', async () => {
    controller.check = jest.fn((_req, res) => res.sendStatus(200));

    const response = await appRequest.get(`${basePath}/check`);

    expect(controller.check).toBeCalledTimes(1);
    expect(response.status).toBe(200);
  });
});

describe(`POST ${basePath}/submitToEmail/process`, () => {
  const path = `${basePath}/submitToEmail/process`;

  beforeEach(() => {
    controller.processSubmissionPackages = jest.fn((_req, res) => res.sendStatus(200));
  });

  it('401s when no apikey is sent', async () => {
    const response = await appRequest.post(path).send({});

    expect(response.status).toBe(401);
    expect(controller.processSubmissionPackages).not.toBeCalled();
  });

  it('401s when only an Authorization header is sent (no apikey bypass)', async () => {
    const response = await appRequest.post(path).set({ authorization: 'Bearer some-token' }).send({});

    expect(response.status).toBe(401);
    expect(controller.processSubmissionPackages).not.toBeCalled();
  });

  it('401s when the apikey does not match', async () => {
    const response = await appRequest.post(path).set({ apikey: uuid.v4() }).send({});

    expect(response.status).toBe(401);
    expect(controller.processSubmissionPackages).not.toBeCalled();
  });

  it('reaches the controller when a matching apikey is sent', async () => {
    const response = await appRequest.post(path).set({ apikey: process.env.APITOKEN }).send({});

    expect(response.status).toBe(200);
    expect(controller.processSubmissionPackages).toBeCalledTimes(1);
  });
});
