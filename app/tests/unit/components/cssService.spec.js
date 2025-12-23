const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const config = require('config');

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

require('../../../src/components/clientConnection');
jest.mock('../../../src/components/clientConnection', () => {
  return jest.fn().mockImplementation(() => {
    return { axios: mockAxios.axiosInstance };
  });
});

const errorToProblem = require('../../../src/components/errorToProblem');
jest.mock('../../../src/components/errorToProblem', () => {
  return jest.fn();
});

const cssService = require('../../../src/components/cssService');

describe('constructor', () => {
  const assertService = (service) => {
    expect(service).toBeTruthy();
    expect(service.apiUrl).toBe(config.get('serviceClient.commonServices.css.endpoint'));
  };

  it('should return a service', () => {
    assertService(cssService);
  });
});

describe('queryIdirUsers', () => {
  it('should not error on success', async () => {
    mockAxios.onGet().reply(200);

    await cssService.queryIdirUsers({});

    expect(errorToProblem).toBeCalledTimes(0);
  });

  it('should handle axios errors', async () => {
    mockAxios.onGet().networkError();

    await cssService.queryIdirUsers({});

    expect(errorToProblem).toBeCalledTimes(1);
  });
});
