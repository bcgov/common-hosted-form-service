const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

jest.mock('../../../../../src/forms/form/service', () => ({
  readApiKey: jest.fn(),
}));

const requireApiKeyBasic = require('../../../../../src/gateway/v1/auth/middleware/requireApiKeyBasic');
const formService = require('../../../../../src/forms/form/service');

function createBasicAuthHeader(formId, apiKey) {
  const credentials = Buffer.from(`${formId}:${apiKey}`).toString('base64');
  return `Basic ${credentials}`;
}

describe('requireApiKeyBasic', () => {
  const formId = uuid.v4();
  const secret = uuid.v4();
  const authHeader = createBasicAuthHeader(formId, secret);

  beforeEach(() => {
    formService.readApiKey.mockReset();
    formService.readApiKey.mockResolvedValue({ secret, filesApiAccess: true });
  });

  it('should return 401 when there is no auth header', async () => {
    const req = getMockReq({ headers: {}, params: { formId } });
    const { res, next } = getMockRes();

    await requireApiKeyBasic(req, res, next);

    expect(formService.readApiKey).toBeCalledTimes(0);
    expect(req.apiUser).toBeFalsy();
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('should return 401 with bearer authorization', async () => {
    const req = getMockReq({
      headers: { authorization: 'Bearer JWT' },
      params: { formId },
    });
    const { res, next } = getMockRes();

    await requireApiKeyBasic(req, res, next);

    expect(formService.readApiKey).toBeCalledTimes(0);
    expect(req.apiUser).toBeFalsy();
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('should return 401 with malformed Basic auth', async () => {
    const malformed = `Basic ${Buffer.from('nocolonseparator').toString('base64')}`;
    const req = getMockReq({
      headers: { authorization: malformed },
      params: { formId },
    });
    const { res, next } = getMockRes();

    await requireApiKeyBasic(req, res, next);

    expect(formService.readApiKey).toBeCalledTimes(0);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('should return 400 with non-uuid form id param', async () => {
    const req = getMockReq({
      headers: { authorization: authHeader },
      params: { formId: 'invalidFormId' },
    });
    const { res, next } = getMockRes();

    await requireApiKeyBasic(req, res, next);

    expect(formService.readApiKey).toBeCalledTimes(0);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('should return 401 when Basic auth formId does not match route param', async () => {
    const otherFormId = uuid.v4();
    const req = getMockReq({
      headers: { authorization: createBasicAuthHeader(otherFormId, secret) },
      params: { formId },
    });
    const { res, next } = getMockRes();

    await requireApiKeyBasic(req, res, next);

    expect(formService.readApiKey).toBeCalledTimes(0);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('should return 401 when db api key result is missing', async () => {
    formService.readApiKey.mockResolvedValue();
    const req = getMockReq({
      headers: { authorization: authHeader },
      params: { formId },
    });
    const { res, next } = getMockRes();

    await requireApiKeyBasic(req, res, next);

    expect(formService.readApiKey).toBeCalledTimes(1);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('should return 401 when api key secret does not match', async () => {
    formService.readApiKey.mockResolvedValue({ secret: uuid.v4(), filesApiAccess: true });
    const req = getMockReq({
      headers: { authorization: authHeader },
      params: { formId },
    });
    const { res, next } = getMockRes();

    await requireApiKeyBasic(req, res, next);

    expect(formService.readApiKey).toBeCalledTimes(1);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('should pass through with valid credentials', async () => {
    const req = getMockReq({
      headers: { authorization: authHeader },
      params: { formId },
    });
    const { res, next } = getMockRes();

    await requireApiKeyBasic(req, res, next);

    expect(formService.readApiKey).toBeCalledTimes(1);
    expect(formService.readApiKey).toBeCalledWith(formId);
    expect(req.apiUser).toBe(true);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });
});
