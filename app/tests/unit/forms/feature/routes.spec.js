const request = require('supertest');

const { expressHelper } = require('../../../common/helper');

const controller = require('../../../../src/forms/feature/controller');

//
// These are public read endpoints — intentionally no auth middleware. Feature
// configuration is mutated only via the admin module (admin-protected).
//

const router = require('../../../../src/forms/feature/routes');
const basePath = '/features';
const app = expressHelper(basePath, router);
const appRequest = request(app);

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
