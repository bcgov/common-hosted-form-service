const { MockModel, MockTransaction } = require('../../../../common/dbHelper');

const uuid = require('uuid');

const { ExternalAPIStatuses } = require('../../../../../src/forms/common/constants');
const service = require('../../../../../src/forms/form/externalApi/service');
const { ENCRYPTION_ALGORITHMS } = require('../../../../../src/components/encryptionService');

jest.mock('../../../../../src/forms/common/models/tables/externalAPI', () => MockModel);

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('checkAllowSendUserToken', () => {
  let validData = null;
  beforeEach(() => {
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
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
      code: ExternalAPIStatuses.SUBMITTED,
    };
  });

  it('should not throw errors with valid data', () => {
    service.checkAllowSendUserToken(validData, true);
  });

  it('should throw 422 with no data', () => {
    expect(() => service.checkAllowSendUserToken(undefined, true)).toThrow();
  });

  it('should throw 422 when sendUserToken = true but not allowed', () => {
    expect(() => service.checkAllowSendUserToken(validData, false)).toThrow();
  });

  it('should blank out user token fields when not allowed', () => {
    validData.sendUserToken = false;
    service.checkAllowSendUserToken(validData, false);
    expect(validData.sendUserToken).toBe(false);
    expect(validData.userTokenHeader).toBe(null);
    expect(validData.userTokenBearer).toBe(false);
  });
});

describe('validateExternalAPI', () => {
  let validData = null;
  beforeEach(() => {
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
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
      code: ExternalAPIStatuses.SUBMITTED,
    };
  });
  it('should not throw errors with valid data', () => {
    service.validateExternalAPI(validData);
  });

  it('should throw 422 with no data', () => {
    expect(() => service.validateExternalAPI(undefined)).toThrow();
  });

  it('should throw 422 when userInfo encryption options are invalid', () => {
    validData.userInfoEncryptionKey = null;
    expect(() => service.validateExternalAPI(undefined)).toThrow();
  });

  it('should throw 422 when userInfoEncryptionAlgo is invalid', () => {
    validData.userInfoEncryptionAlgo = 'not valid!';
    expect(() => service.validateExternalAPI(undefined)).toThrow();
  });

  it('should throw 422 when sendApiKey is true with no header', () => {
    validData.apiKeyHeader = null;
    expect(() => service.validateExternalAPI(undefined)).toThrow();
  });

  it('should throw 422 when sendApiKey is true with no key', () => {
    validData.apiKey = null;
    expect(() => service.validateExternalAPI(undefined)).toThrow();
  });

  it('should throw 422 when sendUserInfo (encrypted) is true with no header', () => {
    validData.userInfoHeader = null;
    expect(() => service.validateExternalAPI(undefined)).toThrow();
  });

  it('should throw 422 when sendUserInfo (encrypted) is true with no header', () => {
    validData.userInfoHeader = null;
    expect(() => service.validateExternalAPI(undefined)).toThrow();
  });
});

describe('createExternalAPI', () => {
  const user = { usernameIdp: 'username' };
  let validData = null;

  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      name: 'test_api',
      endpointUrl: 'http://external.api/',
      sendApiKey: true,
      apiKeyHeader: 'X-API-KEY',
      apiKey: 'my-api-key',
      allowSendUserToken: false,
      sendUserToken: false,
      userTokenHeader: null,
      userTokenBearer: false,
      sendUserInfo: true,
      userInfoHeader: 'X-API-USER',
      userInfoEncrypted: true,
      userInfoEncryptionKey: '0489aa2a7882dc53be7c76db43be1800e56627c31a88a0011d85ccc255b79d00',
      userInfoEncryptionAlgo: ENCRYPTION_ALGORITHMS.AES_256_GCM,
      code: ExternalAPIStatuses.SUBMITTED,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should insert valid data', async () => {
    service._updateAllPreApproved = jest.fn().mockResolvedValueOnce(0);
    validData.id = null;
    validData.code = null;
    await service.createExternalAPI(validData.formId, validData, user);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      code: ExternalAPIStatuses.SUBMITTED,
      ...validData,
    });
    expect(service._updateAllPreApproved).toBeCalledWith(validData.formId, validData, expect.anything());
  });

  it('should raise errors', async () => {
    MockModel.insert = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.createExternalAPI(validData.formId, validData, user)).rejects.toThrow();
  });
});

describe('updateExternalAPI', () => {
  const user = { usernameIdp: 'username' };
  let validData = null;

  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      name: 'test_api',
      endpointUrl: 'http://external.api/',
      sendApiKey: true,
      apiKeyHeader: 'X-API-KEY',
      apiKey: 'my-api-key',
      allowSendUserToken: false,
      sendUserToken: false,
      userTokenHeader: null,
      userTokenBearer: false,
      sendUserInfo: true,
      userInfoHeader: 'X-API-USER',
      userInfoEncrypted: true,
      userInfoEncryptionKey: '0489aa2a7882dc53be7c76db43be1800e56627c31a88a0011d85ccc255b79d00',
      userInfoEncryptionAlgo: ENCRYPTION_ALGORITHMS.AES_256_GCM,
      code: ExternalAPIStatuses.SUBMITTED,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update valid data', async () => {
    service._updateAllPreApproved = jest.fn().mockResolvedValueOnce(0);
    MockModel.throwIfNotFound = jest.fn().mockResolvedValueOnce(Object.assign({}, validData));

    // we do not update (status) code - must stay SUBMITTED
    validData.code = ExternalAPIStatuses.APPROVED;

    await service.updateExternalAPI(validData.formId, validData.id, validData, user);
    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: user.usernameIdp,
      code: ExternalAPIStatuses.SUBMITTED,
      formId: validData.formId,
      name: validData.name,
      endpointUrl: validData.endpointUrl,
      sendApiKey: validData.sendApiKey,
      apiKeyHeader: validData.apiKeyHeader,
      apiKey: validData.apiKey,
      allowSendUserToken: validData.allowSendUserToken,
      sendUserToken: validData.sendUserToken,
      userTokenHeader: validData.userTokenHeader,
      userTokenBearer: validData.userTokenBearer,
    });
    expect(service._updateAllPreApproved).toBeCalledWith(validData.formId, validData, expect.anything());
  });

  it('should update user token fields when allowed', async () => {
    // mark as allowed by admin, and set some user token config values...
    validData.allowSendUserToken = true;
    validData.sendUserToken = true;
    validData.userTokenHeader = 'Authorization';
    validData.userTokenBearer = true;
    MockModel.throwIfNotFound = jest.fn().mockResolvedValueOnce(Object.assign({}, validData));
    service._updateAllPreApproved = jest.fn().mockResolvedValueOnce(0);

    await service.updateExternalAPI(validData.formId, validData.id, validData, user);
    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: user.usernameIdp,
      code: ExternalAPIStatuses.SUBMITTED,
      formId: validData.formId,
      name: validData.name,
      endpointUrl: validData.endpointUrl,
      sendApiKey: validData.sendApiKey,
      apiKeyHeader: validData.apiKeyHeader,
      apiKey: validData.apiKey,
      allowSendUserToken: validData.allowSendUserToken,
      sendUserToken: validData.sendUserToken,
      userTokenHeader: validData.userTokenHeader,
      userTokenBearer: validData.userTokenBearer,
    });
  });

  it('should blank out user token fields when not allowed', async () => {
    // mark as allowed by admin, and set some user token config values...
    validData.allowSendUserToken = false;
    validData.sendUserToken = false; // don't want to throw a 422...
    validData.userTokenHeader = 'Authorization';
    validData.userTokenBearer = true;
    MockModel.throwIfNotFound = jest.fn().mockResolvedValueOnce(Object.assign({}, validData));
    service._updateAllPreApproved = jest.fn().mockResolvedValueOnce(0);

    await service.updateExternalAPI(validData.formId, validData.id, validData, user);
    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: user.usernameIdp,
      code: ExternalAPIStatuses.SUBMITTED,
      allowSendUserToken: false,
      sendUserToken: false,
      userTokenHeader: null,
      userTokenBearer: false,
      formId: validData.formId,
      name: validData.name,
      endpointUrl: validData.endpointUrl,
      sendApiKey: validData.sendApiKey,
      apiKeyHeader: validData.apiKeyHeader,
      apiKey: validData.apiKey,
    });
  });

  it('should throw error when not found', async () => {
    MockModel.throwIfNotFound = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.updateExternalAPI(validData.formId, validData.id, validData, user)).rejects.toThrow();
  });

  it('should raise errors', async () => {
    MockModel.update = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.updateExternalAPI(validData.formId, validData.id, validData, user)).rejects.toThrow();
  });
});
