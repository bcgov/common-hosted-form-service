/* eslint-env jest */

const { parseBasicPair } = require('../../../../../../src/runtime-auth/security/auth/utils/basicAuth');

describe('auth/utils/basicAuth', () => {
  it('should parse valid Basic auth header', () => {
    const credentials = Buffer.from('form-id:secret-key').toString('base64');
    expect(parseBasicPair(`Basic ${credentials}`)).toEqual({
      formId: 'form-id',
      apiKey: 'secret-key',
    });
  });

  it('should parse Basic auth header case-insensitively', () => {
    const credentials = Buffer.from('form-id:secret-key').toString('base64');
    expect(parseBasicPair(`basic ${credentials}`)).toEqual({
      formId: 'form-id',
      apiKey: 'secret-key',
    });
  });

  it('should return null when credentials have no colon separator', () => {
    const credentials = Buffer.from('invalidcredentials').toString('base64');
    expect(parseBasicPair(`Basic ${credentials}`)).toBeNull();
  });

  it('should return null for invalid base64', () => {
    expect(parseBasicPair('Basic !!!')).toBeNull();
  });
});
