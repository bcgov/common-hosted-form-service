const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const config = require('config');

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

jest.mock('../../../src/components/clientConnection', () => {
  return jest.fn().mockImplementation(() => {
    return { axios: mockAxios.axiosInstance };
  });
});

const mockLog = { warn: jest.fn(), error: jest.fn(), debug: jest.fn(), info: jest.fn(), verbose: jest.fn() };
jest.mock('../../../src/components/log', () => jest.fn(() => mockLog));

const chesService = require('../../../src/components/chesService');

describe('constructor', () => {
  it('should return a service', () => {
    expect(chesService).toBeTruthy();
    expect(chesService.apiUrl).toBe(config.get('serviceClient.commonServices.ches.endpoint'));
  });
});

describe('merge', () => {
  afterEach(() => {
    mockAxios.reset();
    mockLog.warn.mockClear();
    mockLog.error.mockClear();
  });

  it('should not error on success', async () => {
    mockAxios.onPost().reply(200, { txId: '123' });

    const result = await chesService.merge({});

    expect(result).toEqual({ txId: '123' });
    expect(mockLog.warn).not.toHaveBeenCalled();
    expect(mockLog.error).not.toHaveBeenCalled();
  });

  it('should log and throw a validation Problem on a 422 response', async () => {
    mockAxios.onPost().reply(422, { detail: 'bad request', errors: [] });

    await expect(chesService.merge({})).rejects.toMatchObject({ status: 422 });

    expect(mockLog.warn).toHaveBeenCalledTimes(1);
    expect(mockLog.warn.mock.calls[0][0]).toContain('Validation Error during CHES.emailMerge');
  });

  it('should log and throw a Problem on a non-422 error response', async () => {
    mockAxios.onPost().reply(500, { detail: 'server error' });

    await expect(chesService.merge({})).rejects.toMatchObject({ status: 500 });

    expect(mockLog.error).toHaveBeenCalledTimes(1);
    expect(mockLog.error.mock.calls[0][0]).toContain('Error During CHES.emailMerge');
  });

  it('should log and throw a 502 Problem when there is no response (network error)', async () => {
    mockAxios.onPost().networkError();

    await expect(chesService.merge({})).rejects.toMatchObject({ status: 502 });

    expect(mockLog.error).toHaveBeenCalledTimes(1);
    expect(mockLog.error.mock.calls[0][0]).toContain('Unknown error calling CHES.emailMerge');
  });

  it('should include the message id in the log when provided (cancelMsg)', async () => {
    mockAxios.onDelete().networkError();

    await expect(chesService.cancelMsg('msg-123')).rejects.toMatchObject({ status: 502 });

    expect(mockLog.error.mock.calls[0][0]).toContain('messageID: msg-123');
  });
});
