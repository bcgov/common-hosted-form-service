const AxiosService = require('../../../src/components/axiosService');

const authConfig = {
  tokenUrl: 'https://example.com/token',
  clientId: 'id',
  clientSecret: 'secret',
  apiUrl: 'https://example.com/api',
  serviceName: 'TEST',
};

describe('AxiosService constructor', () => {
  it('throws when apiUrl is missing', () => {
    expect(() => new AxiosService({ serviceName: 'TEST' })).toThrow('TEST is not configured. Check configuration.');
  });

  it('builds an authenticated client when all credentials are present', () => {
    const service = new AxiosService(authConfig);
    expect(service.axios).toBeTruthy();
    expect(service.connection).toBeTruthy();
    expect(service.apiUrl).toBe(authConfig.apiUrl);
  });

  it('builds a credential-less client when no auth settings are provided', () => {
    const service = new AxiosService({ apiUrl: 'https://example.com/api', serviceName: 'TEST', version: 'v3' });
    expect(service.axios).toBeTruthy();
    expect(service.connection).toBeUndefined();
    expect(service.getBaseUrl()).toBe('https://example.com/api/v3');
  });

  it('throws when auth is partially configured', () => {
    expect(() => new AxiosService({ tokenUrl: authConfig.tokenUrl, apiUrl: authConfig.apiUrl, serviceName: 'TEST' })).toThrow('TEST is not configured. Check configuration.');
  });

  it('defaults version to v1', () => {
    const service = new AxiosService({ apiUrl: 'https://example.com/api', serviceName: 'TEST' });
    expect(service.getBaseUrl()).toBe('https://example.com/api/v1');
  });
});
