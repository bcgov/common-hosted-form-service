const { MockModel, MockTransaction } = require('../../../../common/dbHelper');

const uuid = require('uuid');

const service = require('../../../../../src/forms/form/eventStreamConfig/service');
const encryptionKeyService = require('../../../../../src/forms/form/encryptionKey/service');

jest.mock('../../../../../src/forms/common/models/tables/formEventStreamConfig', () => MockModel);
jest.mock('../../../../../src/forms/common/models/tables/formEncryptionKey', () => MockModel);

const currentUser = {
  usernameIdp: 'TESTER',
};

const formId = uuid.v4();
const encryptionKeyId = uuid.v4();

const validData = {
  id: uuid.v4(),
  formId: formId,
  enablePublicStream: true,
  enablePrivateStream: true,
  encryptionKeyId: encryptionKeyId,
};

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('validate', () => {
  it('should not throw errors with valid data', () => {
    service.validateEventStreamConfig(validData);
  });

  it('should throw 422 with no data', () => {
    expect(() => service.validateEventStreamConfig(undefined)).toThrow();
  });
});

describe('readEventStreamConfig', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return valid data', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(validData);
    const res = await service.readEventStreamConfig(validData.formId, currentUser);
    expect(MockModel.first).toBeCalledTimes(1);
    expect(res).toEqual(validData);
  });
});

describe('upsert', () => {
  beforeEach(() => {
    MockModel.mockClear();
    MockModel.mockReset();
    MockTransaction.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update valid data', async () => {
    encryptionKeyService.upsertForEventStreamConfig = jest.fn().mockResolvedValueOnce({ id: encryptionKeyId });
    MockModel.first = jest.fn().mockResolvedValue(Object.assign({}, validData));
    let data = Object.assign({}, validData);
    data.enablePublicStream = false; // make a change, force the update
    await service.upsert(validData.formId, data, currentUser);
    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: currentUser.usernameIdp,
      ...data,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should create when not found', async () => {
    encryptionKeyService.upsertForEventStreamConfig = jest.fn().mockResolvedValueOnce({ id: encryptionKeyId });
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    service.initModel = jest.fn().mockReturnValue(validData);
    await service.upsert(validData.formId, validData, currentUser);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: currentUser.usernameIdp,
      ...validData,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should raise errors on failed update', async () => {
    encryptionKeyService.upsertForEventStreamConfig = jest.fn().mockResolvedValueOnce({ id: encryptionKeyId });
    MockModel.first = jest.fn().mockResolvedValue(Object.assign({}, validData));
    MockModel.update = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    let data = Object.assign({}, validData);
    data.enablePublicStream = false; // make a change, force the update
    await expect(service.upsert(validData.formId, data, currentUser)).rejects.toThrow();
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });

  it('should raise errors on failed insert', async () => {
    encryptionKeyService.upsertForEventStreamConfig = jest.fn().mockResolvedValueOnce({ id: encryptionKeyId });
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    MockModel.insert = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.upsert(validData.formId, validData, currentUser)).rejects.toThrow();
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });

  it('should use provided transaction', async () => {
    encryptionKeyService.upsertForEventStreamConfig = jest.fn().mockResolvedValueOnce({ id: encryptionKeyId });
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    await service.upsert(validData.formId, validData, currentUser, xact);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: currentUser.usernameIdp,
      ...validData,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });

  it('should remove encryption key when no private stream', async () => {
    encryptionKeyService.upsertForEventStreamConfig = jest.fn().mockResolvedValueOnce({ id: encryptionKeyId });
    encryptionKeyService.remove = jest.fn().mockResolvedValueOnce();
    MockModel.first = jest.fn().mockResolvedValue(Object.assign({}, validData));
    let data = Object.assign({}, validData);
    data.enablePrivateStream = false; // make a change, force the update
    await service.upsert(validData.formId, data, currentUser);
    // should remove the encryption key
    data.encryptionKeyId = null;
    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: currentUser.usernameIdp,
      ...data,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(1);
    expect(encryptionKeyService.remove).toBeCalledTimes(1);
  });
});
