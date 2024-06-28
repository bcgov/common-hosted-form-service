const { MockModel, MockTransaction } = require('../../../common/dbHelper');

const { v4: uuidv4 } = require('uuid');

const { encryptionService, ENCRYPTION_ALGORITHMS } = require('../../../../src/components/encryptionService');
const service = require('../../../../src/forms/proxy/service');
const { ExternalAPI } = require('../../../../src/forms/common/models');

const goodPayload = {
  formId: '123',
  submissionId: '456',
  versionId: '789',
};

const goodCurrentUser = {
  idpUserId: '123456789',
  username: 'TMCTEST',
  firstName: 'Test',
  lastName: 'McTest',
  fullName: 'Test McTest',
  email: 'test.mctest@gov.bc.ca',
  idp: 'idir',
};

const token = 'token!';

const goodProxyHeaderInfo = {
  ...goodPayload,
  ...goodCurrentUser,
  userId: goodCurrentUser.idpUserId,
  token: token,
};
delete goodProxyHeaderInfo.idpUserId;

const goodExternalApi = {
  id: uuidv4(),
  formId: uuidv4(),
  name: 'test_api',
  endpointUrl: 'http://external.api/',
  sendApiKey: true,
  apiKeyHeader: 'X-API-KEY',
  apiKey: 'my-api-key',
  sendUserToken: true,
  userTokenHeader: 'Authorization',
  userTokenBearer: true,
  sendUserInfo: true,
  userInfoHeader: 'X-API-USER',
  userInfoEncrypted: true,
  userInfoEncryptionKey: '0489aa2a7882dc53be7c76db43be1800e56627c31a88a0011d85ccc255b79d00',
  userInfoEncryptionAlgo: ENCRYPTION_ALGORITHMS.AES_256_GCM,
};

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Proxy Service', () => {
  describe('generateProxyHeaders', () => {
    beforeEach(() => {});

    it('should throw error with no payload', async () => {
      await expect(service.generateProxyHeaders(undefined, goodCurrentUser, token)).rejects.toThrow();
    });
    it('should throw error with no current user', async () => {
      await expect(service.generateProxyHeaders(goodPayload, undefined, token)).rejects.toThrow();
    });
    it('should throw error with invalid current user', async () => {
      await expect(service.generateProxyHeaders(goodPayload, {}, token)).rejects.toThrow();
    });
    it('should return headers with no token', async () => {
      const result = await service.generateProxyHeaders(goodPayload, goodCurrentUser, undefined);
      expect(result).toBeTruthy();
      expect(result['X-CHEFS-PROXY-DATA']).toBeTruthy();
    });
    it('should return headers encrypted by proxy key', async () => {
      const result = await service.generateProxyHeaders(goodPayload, goodCurrentUser, token);
      expect(result).toBeTruthy();
      expect(result['X-CHEFS-PROXY-DATA']).toBeTruthy();
      // check the encryption...
      const decrypted = encryptionService.decryptProxy(result['X-CHEFS-PROXY-DATA']);
      expect(JSON.parse(decrypted)).toMatchObject(goodProxyHeaderInfo);
    });
  });
  describe('readProxyHeaders', () => {
    beforeEach(() => {});

    it('should throw error with no headers', async () => {
      await expect(service.readProxyHeaders(undefined)).rejects.toThrow();
    });

    it('should throw error with wrong header name', async () => {
      await expect(service.readProxyHeaders({ 'X-CHEFS-WRONG_HEADER_NAME': 'headers' })).rejects.toThrow();
    });

    it('should throw error if payload not encrypted', async () => {
      await expect(service.readProxyHeaders({ 'X-CHEFS-PROXY-DATA': 'headers' })).rejects.toThrow();
    });

    it('should throw error if payload uses non-proxy encryption', async () => {
      const externalKey = 'e9eb43121581f1877e2b8135c8d9079b91c04aab6c717799196630a685b2c6c0';
      const data = encryptionService.encryptExternal(ENCRYPTION_ALGORITHMS.AES_256_GCM, externalKey, goodProxyHeaderInfo);
      await expect(service.readProxyHeaders({ 'X-CHEFS-PROXY-DATA': data })).rejects.toThrow();
    });

    it('should return decrypted header data', async () => {
      const headers = await service.generateProxyHeaders(goodPayload, goodCurrentUser, token);
      const decrypted = await service.readProxyHeaders(headers);
      expect(decrypted).toBeTruthy();
      expect(goodProxyHeaderInfo).toMatchObject(decrypted);
    });
  });
  describe('getExternalAPI', () => {
    let returnValue = null;
    beforeEach(() => {
      returnValue = null;
      ExternalAPI.mockReturnValue = (value) => {
        returnValue = value;
      };
      ExternalAPI.query = jest.fn().mockReturnThis();
      ExternalAPI.where = jest.fn().mockReturnThis();
      ExternalAPI.modify = jest.fn().mockReturnThis();
      ExternalAPI.first = jest.fn().mockReturnThis();
      ExternalAPI.throwIfNotFound = jest.fn().mockReturnThis();
      ExternalAPI.then = jest.fn((done) => {
        done(returnValue);
      });
    });

    it('should throw error with no headers', async () => {
      // set the external api name...
      const headers = undefined;
      await expect(service.getExternalAPI(headers, goodProxyHeaderInfo)).rejects.toThrow();
    });

    it('should throw error with no proxy header info', async () => {
      // set the external api name...
      const headers = { 'X-CHEFS-EXTERNAL-API-NAME': 'testapi' };
      await expect(service.getExternalAPI(headers, undefined)).rejects.toThrow();
    });

    it('should throw error if api name not found', async () => {
      // set the external api name...
      const headers = { 'X-CHEFS-EXTERNAL-API-NAME': 'notfound' };
      ExternalAPI.throwIfNotFound = jest.fn().mockRejectedValue(new Error('not found'));
      await expect(service.getExternalAPI(headers, goodProxyHeaderInfo)).rejects.toThrow();
    });

    it('should return data with correct parameters', async () => {
      // set the external api name...
      const headers = { 'X-CHEFS-EXTERNAL-API-NAME': 'testapi' };
      returnValue = {}; //pretend this is an actual ExternalAPI record/object
      const result = await service.getExternalAPI(headers, goodProxyHeaderInfo);
      await expect(result).toBe(returnValue);
    });
  });
  describe('createExternalAPIUrl', () => {
    it('should throw error with no headers', async () => {
      const headers = undefined;
      const endpointUrl = 'http://external.api/'; // comes from ExternalAPI record
      expect(() => service.createExternalAPIUrl(headers, endpointUrl)).toThrow();
    });

    it('should throw error with no external api url', async () => {
      const headers = { 'X-CHEFS-EXTERNAL-API-PATH': '/api/v1/testapi' };
      expect(() => service.createExternalAPIUrl(headers, undefined)).toThrow();
    });

    it('should return endpointUrl if no path header', async () => {
      const headers = {};
      const endpointUrl = 'http://external.api/'; // comes from ExternalAPI record
      const result = service.createExternalAPIUrl(headers, endpointUrl);
      await expect(result).toBe(endpointUrl);
    });

    it('should append path to endpointUrl', async () => {
      const headers = { 'X-CHEFS-EXTERNAL-API-PATH': '/api/v1/testapi' };
      const endpointUrl = 'http://external.api'; // comes from ExternalAPI record
      const result = service.createExternalAPIUrl(headers, endpointUrl);
      await expect(result).toBe(`${endpointUrl}/api/v1/testapi`);
    });

    it('should handle leading and trailing slashes when building result', async () => {
      // have both trailing / on url and leading / on path
      const headers = { 'X-CHEFS-EXTERNAL-API-PATH': '/api/v1/testapi' };
      const endpointUrl = 'http://external.api/'; // comes from ExternalAPI record
      const result = service.createExternalAPIUrl(headers, endpointUrl);
      // only one slash between url and path
      await expect(result).toBe('http://external.api/api/v1/testapi');
    });
  });
  describe('createExternalAPIHeaders', () => {
    beforeEach(() => {});

    it('should throw error with no headers', async () => {
      const externalAPI = undefined;
      const proxyHeaderInfo = goodProxyHeaderInfo;
      await expect(service.createExternalAPIHeaders(externalAPI, proxyHeaderInfo)).rejects.toThrow();
    });
    it('should throw error with no current user and sending user information', async () => {
      const externalAPI = goodExternalApi;
      const proxyHeaderInfo = undefined;
      await expect(service.createExternalAPIHeaders(externalAPI, proxyHeaderInfo)).rejects.toThrow();
    });
    it('should throw error with invalid current user and sending user information', async () => {
      const externalAPI = goodExternalApi;
      const proxyHeaderInfo = {};
      await expect(service.createExternalAPIHeaders(externalAPI, proxyHeaderInfo)).rejects.toThrow();
    });
    it('should NOT throw error with no current user and not sending user information', async () => {
      const externalAPI = Object.assign({}, goodExternalApi);
      externalAPI.sendUserToken = false;
      externalAPI.sendUserInfo = false;
      const proxyHeaderInfo = undefined;
      const result = await service.createExternalAPIHeaders(externalAPI, proxyHeaderInfo);
      expect(result).toBeTruthy();
    });
    it('should NOT throw error with invalid current user and not sending user information', async () => {
      const externalAPI = Object.assign({}, goodExternalApi);
      externalAPI.sendUserToken = false;
      externalAPI.sendUserInfo = false;
      const proxyHeaderInfo = {};
      const result = await service.createExternalAPIHeaders(externalAPI, proxyHeaderInfo);
      expect(result).toBeTruthy();
    });
    it('should return populated headers', async () => {
      const externalAPI = Object.assign({}, goodExternalApi);
      const proxyHeaderInfo = Object.assign({}, goodProxyHeaderInfo);
      const result = await service.createExternalAPIHeaders(externalAPI, proxyHeaderInfo);
      expect(result).toBeTruthy();
      // with the defaul external API config we should have headers for...
      // api key
      expect(result[externalAPI.apiKeyHeader]).toBe(externalAPI.apiKey);
      // user token (with Bearer)
      expect(result[externalAPI.userTokenHeader]).toBe(`Bearer ${token}`);
      // use r
      expect(result['X-CHEFS-USER-EMAIL']).toBeTruthy();
    });
    it('should return only api key headers', async () => {
      const externalAPI = Object.assign({}, goodExternalApi);
      externalAPI.sendApiKey = true;
      externalAPI.sendUserToken = false;
      externalAPI.sendUserInfo = false;
      const proxyHeaderInfo = Object.assign({}, goodProxyHeaderInfo);
      const result = await service.createExternalAPIHeaders(externalAPI, proxyHeaderInfo);
      expect(result).toBeTruthy();
      // api key
      expect(result[externalAPI.apiKeyHeader]).toBe(externalAPI.apiKey);
      // no user token
      expect(result[externalAPI.userTokenHeader]).toBeFalsy();
      // no user info (encrypted)
      expect(result[externalAPI.userInfoHeader]).toBeFalsy();
      // no unencrypted user info headers
      expect(result['X-CHEFS-USER-EMAIL']).toBeFalsy();
    });
    it('should return only user token header (no bearer)', async () => {
      const externalAPI = Object.assign({}, goodExternalApi);
      externalAPI.sendApiKey = false;
      externalAPI.sendUserToken = true;
      externalAPI.sendUserInfo = false;
      externalAPI.userTokenBearer = false;
      const userInfo = Object.assign({}, goodProxyHeaderInfo);
      const result = await service.createExternalAPIHeaders(externalAPI, userInfo);
      expect(result).toBeTruthy();
      // no api key
      expect(result[externalAPI.apiKeyHeader]).toBeFalsy();
      // user token (NO Bearer)
      expect(result[externalAPI.userTokenHeader]).toBe(token);
      // no user info (encrypted)
      expect(result[externalAPI.userInfoHeader]).toBeFalsy();
      // no user info headers
      expect(result['X-CHEFS-USER-EMAIL']).toBeFalsy();
    });
    it('should return only unencrypted user info headers', async () => {
      const externalAPI = Object.assign({}, goodExternalApi);
      externalAPI.sendApiKey = false;
      externalAPI.sendUserToken = false;
      externalAPI.sendUserInfo = true;
      const userInfo = Object.assign({}, goodProxyHeaderInfo);
      const result = await service.createExternalAPIHeaders(externalAPI, userInfo);
      expect(result).toBeTruthy();
      // with the defaul external API config we should have headers for...
      // no api key
      expect(result[externalAPI.apiKeyHeader]).toBeFalsy();
      // no user token (with Bearer)
      expect(result[externalAPI.userTokenHeader]).toBeFalsy();
      //  user info headers
      expect(result['X-CHEFS-USER-EMAIL']).toBe(userInfo.email);
      expect(result['X-CHEFS-FORM-FORMID']).toBe(userInfo.formId);
    });
  });
});
