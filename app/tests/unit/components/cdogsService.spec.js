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

const cdogsService = require('../../../src/components/cdogsService');

describe('constructor', () => {
  const assertService = (service) => {
    expect(service).toBeTruthy();
    expect(service.apiUrl).toBe(config.get('serviceClient.commonServices.cdogs.endpoint'));
  };

  it('should return a service', () => {
    assertService(cdogsService);
  });
});

describe('templateUploadAndRender', () => {
  it('should not error on success', async () => {
    mockAxios.onPost().reply(200);

    await cdogsService.templateUploadAndRender();

    expect(errorToProblem).toBeCalledTimes(0);
  });

  it('should handle axios errors', async () => {
    mockAxios.onPost().networkError();

    await cdogsService.templateUploadAndRender();

    expect(errorToProblem).toBeCalledTimes(1);
  });
});
