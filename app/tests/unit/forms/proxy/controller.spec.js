const axios = require('axios');
const { getMockReq, getMockRes } = require('@jest-mock/express');

const controller = require('../../../../src/forms/proxy/controller');
const service = require('../../../../src/forms/proxy/service');
const jwtService = require('../../../../src/components/jwtService');
const { NotFoundError } = require('objection');

const bearerToken = Math.random().toString(36).substring(2);

jwtService.validateAccessToken = jest.fn().mockReturnValue(true);
jwtService.getBearerToken = jest.fn().mockReturnValue(bearerToken);
jwtService.getTokenPayload = jest.fn().mockReturnValue({ token: 'payload' });

// Replace any instances with the mocked instance (a new mock could be used here instead):
jest.mock('axios');
axios.create.mockImplementation(() => axios);

afterEach(() => {
  jest.clearAllMocks();
});

describe('generateProxyHeaders', () => {
  const req = {
    params: {},
    body: { formId: '1234' },
    currentUser: { idpUserId: '123456789', username: 'TMCTEST', firstName: 'Test', lastName: 'McTest', fullName: 'Test McTest', email: 'test.mctest@gov.bc.ca', idp: 'idir' },
    headers: { referer: 'a' },
  };

  it('should generate headers', async () => {
    service.generateProxyHeaders = jest.fn().mockReturnValue({});

    await controller.generateProxyHeaders(req, {}, jest.fn());
    expect(service.generateProxyHeaders).toBeCalledTimes(1);
    expect(jwtService.getBearerToken).toBeCalledTimes(1);
  });
});

describe('callExternalApi', () => {
  it('should call external api', async () => {
    const req = getMockReq({ headers: { 'X-CHEFS-PROXY-DATA': 'encrypted blob of proxy data' } });
    const { res, next } = getMockRes();
    service.readProxyHeaders = jest.fn().mockReturnValue({});
    service.getExternalAPI = jest.fn().mockReturnValue({ code: 'APPROVED' });
    service.createExternalAPIUrl = jest.fn().mockReturnValue('http://external.api');
    service.createExternalAPIHeaders = jest.fn().mockReturnValue({ 'X-TEST-HEADERS': 'test-headers' });

    const mockResponse = {
      data: [{ name: 'a', value: 'A' }],
      status: 200,
    };
    axios.get.mockResolvedValueOnce(mockResponse);

    await controller.callExternalApi(req, res, next);

    expect(service.readProxyHeaders).toBeCalledTimes(1);
    expect(service.getExternalAPI).toBeCalledTimes(1);
    expect(service.createExternalAPIUrl).toBeCalledTimes(1);
    expect(service.createExternalAPIHeaders).toBeCalledTimes(1);
    expect(res.status).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when external api returns 401', async () => {
    const req = getMockReq({ headers: { 'X-CHEFS-PROXY-DATA': 'encrypted blob of proxy data' } });
    const { res, next } = getMockRes();

    const mockResponse = {
      data: {},
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {},
      response: {
        data: { errors: [{ detail: 'a' }] },
      },
    };
    axios.get.mockRejectedValueOnce(mockResponse);

    service.readProxyHeaders = jest.fn().mockReturnValue({});
    service.getExternalAPI = jest.fn().mockReturnValue({ code: 'APPROVED' });
    service.createExternalAPIUrl = jest.fn().mockReturnValue('http://external.api/private');
    service.createExternalAPIHeaders = jest.fn().mockReturnValue({ 'X-TEST-HEADERS': 'test-headers-err' });

    await controller.callExternalApi(req, res, next);

    expect(service.readProxyHeaders).toBeCalledTimes(1);
    expect(service.getExternalAPI).toBeCalledTimes(1);
    expect(service.createExternalAPIUrl).toBeCalledTimes(1);
    expect(service.createExternalAPIHeaders).toBeCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toBeCalledTimes(1);
  });

  it('should call next when external api returns 500', async () => {
    const req = getMockReq({ headers: { 'X-CHEFS-PROXY-DATA': 'encrypted blob of proxy data' } });
    const { res, next } = getMockRes();

    const mockResponse = {
      data: {},
      status: 500,
      response: {
        data: { errors: [{ detail: 'server error' }] },
      },
    };
    axios.get.mockRejectedValueOnce(mockResponse);

    service.readProxyHeaders = jest.fn().mockReturnValue({});
    service.getExternalAPI = jest.fn().mockReturnValue({ code: 'APPROVED' });
    service.createExternalAPIUrl = jest.fn().mockReturnValue('http://external.api/private');
    service.createExternalAPIHeaders = jest.fn().mockReturnValue({ 'X-TEST-HEADERS': 'test-headers-err' });

    await controller.callExternalApi(req, res, next);

    expect(service.readProxyHeaders).toBeCalledTimes(1);
    expect(service.getExternalAPI).toBeCalledTimes(1);
    expect(service.createExternalAPIUrl).toBeCalledTimes(1);
    expect(service.createExternalAPIHeaders).toBeCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toBeCalledTimes(1);
  });

  it('should not call external api if not approved', async () => {
    const req = getMockReq({ headers: { 'X-CHEFS-PROXY-DATA': 'encrypted blob of proxy data' } });
    const { res, next } = getMockRes();
    service.readProxyHeaders = jest.fn().mockReturnValue({});
    service.getExternalAPI = jest.fn().mockReturnValue({ code: 'SUBMITTED' });
    service.createExternalAPIUrl = jest.fn().mockReturnValue('http://external.api');
    service.createExternalAPIHeaders = jest.fn().mockReturnValue({ 'X-TEST-HEADERS': 'test-headers' });

    const mockResponse = {
      data: [{ name: 'a', value: 'A' }],
      status: 200,
    };
    axios.get.mockResolvedValueOnce(mockResponse);

    await controller.callExternalApi(req, res, next);

    expect(service.readProxyHeaders).toBeCalledTimes(1);
    expect(service.getExternalAPI).toBeCalledTimes(1);
    expect(service.createExternalAPIUrl).toBeCalledTimes(1);
    expect(service.createExternalAPIHeaders).toBeCalledTimes(1);
    // this is the point where we check the status code for external api
    expect(axios.get).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toBeCalledTimes(1);
  });

  it('should return 400 when headers missing', async () => {
    const req = getMockReq({ headers: { 'X-CHEFS-PROXY-DATA': 'encrypted blob of proxy data' } });
    const { res, next } = getMockRes();

    service.readProxyHeaders = jest.fn().mockReturnValue({});
    service.getExternalAPI = jest.fn().mockRejectedValueOnce(new NotFoundError());
    service.createExternalAPIUrl = jest.fn().mockReturnValue('http://external.api/private');
    service.createExternalAPIHeaders = jest.fn().mockReturnValue({ 'X-TEST-HEADERS': 'test-headers-err' });

    await controller.callExternalApi(req, res, next);

    expect(service.readProxyHeaders).toBeCalledTimes(1);
    expect(service.getExternalAPI).toBeCalledTimes(1);
    expect(service.createExternalAPIUrl).not.toHaveBeenCalled();
    expect(service.createExternalAPIHeaders).not.toHaveBeenCalled();
    expect(res.sendStatus).toBeCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
