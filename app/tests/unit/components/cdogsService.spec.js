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

  describe('v2 (default)', () => {
    it('should use the common cdogs endpoint', () => {
      expect(cdogsService.apiUrl).toBe(config.get('serviceClient.commonServices.cdogs.endpoint'));
    });

    it('should specify version as v2', () => {
      expect(cdogsService.version).toBe('v2');
    });
  });

  describe('v3', () => {
    it('should use the scoped v3 endpoint', () => {
      expect(cdogsService.v3).toBeTruthy();
      expect(cdogsService.v3.apiUrl).toBe(config.get('serviceClient.commonServices.cdogs.v3.endpoint'));
    });

    it('should specify version as v3', () => {
      expect(cdogsService.v3.version).toBe('v3');
    });
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
