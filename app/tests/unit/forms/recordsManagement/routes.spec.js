const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

//
// Lock down the auth on the system-only deletion endpoint. This route is called
// by an OpenShift cron with the `apikey` header, and must NOT be reachable by
// sending an arbitrary Authorization header. checkApiKey runs for real here; the
// controller is stubbed so we don't touch the service/database layer.
//
jest.mock('../../../../src/forms/recordsManagement/controller');
const controller = require('../../../../src/forms/recordsManagement/controller');
controller.processDeletions = jest.fn((_req, res) => {
  res.sendStatus(200);
});

const router = require('../../../../src/forms/recordsManagement/routes');
const basePath = '/recordsManagement';
const appRequest = request(expressHelper(basePath, router));

const path = `${basePath}/internal/deletions/process`;

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

describe(`POST ${path} auth`, () => {
  it('401s when no credentials are sent', async () => {
    const response = await appRequest.post(path).send({});

    expect(response.status).toBe(401);
    expect(controller.processDeletions).not.toBeCalled();
  });

  it('401s when only an Authorization header is sent (no apikey bypass)', async () => {
    const response = await appRequest.post(path).set({ authorization: 'Bearer some-token' }).send({});

    expect(response.status).toBe(401);
    expect(controller.processDeletions).not.toBeCalled();
  });

  it('401s when the apikey does not match', async () => {
    const response = await appRequest.post(path).set({ apikey: uuid.v4() }).send({});

    expect(response.status).toBe(401);
    expect(controller.processDeletions).not.toBeCalled();
  });

  it('reaches the controller when a matching apikey is sent', async () => {
    const response = await appRequest.post(path).set({ apikey: process.env.APITOKEN }).send({});

    expect(response.status).toBe(200);
    expect(controller.processDeletions).toBeCalledTimes(1);
  });
});
