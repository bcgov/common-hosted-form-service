const MockAdapter = require('axios-mock-adapter');
const config = require('config');

const errorToProblem = require('../../../src/components/errorToProblem');
jest.mock('../../../src/components/errorToProblem', () => {
  return jest.fn();
});

const cdogsV3Service = require('../../../src/components/cdogsV3Service');

// CDOGS v3 runs credential-less (plain axios), so there is no ClientConnection to
// mock; instead drive the service's own axios instance with a mock adapter.
const mockAxios = new MockAdapter(cdogsV3Service.axios);

beforeEach(() => {
  mockAxios.reset();
  errorToProblem.mockReset();
});

describe('constructor', () => {
  it('should return a service configured for v3', () => {
    expect(cdogsV3Service).toBeTruthy();
    expect(cdogsV3Service.apiUrl).toBe(config.get('serviceClient.commonServices.cdogsV3.endpoint'));
    expect(cdogsV3Service.version).toBe('v3');
    // credential-less: no OAuth connection
    expect(cdogsV3Service.connection).toBeUndefined();
  });

  it('targets the v3 base url', () => {
    expect(cdogsV3Service.getBaseUrl()).toBe(`${config.get('serviceClient.commonServices.cdogsV3.endpoint')}/v3`);
  });
});

describe('templateUploadAndRender', () => {
  it('should not error on success', async () => {
    mockAxios.onPost().reply(200);

    await cdogsV3Service.templateUploadAndRender();

    expect(errorToProblem).toBeCalledTimes(0);
  });

  it('should handle axios errors', async () => {
    mockAxios.onPost().networkError();

    await cdogsV3Service.templateUploadAndRender();

    expect(errorToProblem).toBeCalledTimes(1);
  });
});
