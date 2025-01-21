const { MockModel, MockTransaction } = require('../../../../common/dbHelper');

const uuid = require('uuid');

const service = require('../../../../../src/forms/form/encryptionKey/service');
const { ENCRYPTION_ALGORITHMS } = require('../../../../../src/components/encryptionService');

jest.mock('../../../../../src/forms/common/models/tables/formEncryptionKey', () => MockModel);

const user = {
  usernameIdp: 'TESTER',
};

const formId = uuid.v4();

const validData = {
  id: uuid.v4(),
  formId: formId,
  name: 'test',
  algorithm: 'aes-256-gcm',
  key: 'ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985',
};

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('listEncryptionAlgorithms', () => {
  it('should return valid data', async () => {
    const res = await service.listEncryptionAlgorithms();
    expect(res.length).toEqual(Object.keys(ENCRYPTION_ALGORITHMS).length);
    expect(Object.keys(res[0]).includes('code')).toBeTruthy();
    expect(Object.keys(res[0]).includes('display')).toBeTruthy();
  });
});

describe('readEncryptionKey', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return valid data', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(validData);
    const res = await service.readEncryptionKey(validData.formId, validData.formEncryptionKeyId);
    expect(MockModel.first).toBeCalledTimes(1);
    expect(res).toEqual(validData);
  });
});

describe('remove', () => {
  beforeEach(() => {
    MockModel.mockClear();
    MockModel.mockReset();
    MockTransaction.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should remove valid id', async () => {
    MockModel.findById = jest.fn().mockResolvedValue(Object.assign({}, validData));

    await service.remove(validData.id);
    expect(MockModel.deleteById).toBeCalledTimes(1);
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should not remove invalid id', async () => {
    MockModel.findById = jest.fn().mockResolvedValue(null);

    await service.remove(validData.id);
    expect(MockModel.deleteById).toBeCalledTimes(0);
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should raise errors on failed delete', async () => {
    MockModel.findById = jest.fn().mockResolvedValue(Object.assign({}, validData));
    MockModel.deleteById = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.remove(validData.id)).rejects.toThrow();
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });

  it('should use provided transaction', async () => {
    MockModel.findById = jest.fn().mockResolvedValue(Object.assign({}, validData));
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    await service.remove(validData.id, xact);
    expect(MockModel.deleteById).toBeCalledTimes(1);
    expect(MockModel.startTransaction).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });
});
describe('_insert', () => {
  beforeEach(() => {
    MockModel.mockClear();
    MockModel.mockReset();
    MockTransaction.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create with good data', async () => {
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    let id = await service._insert(validData, user, xact);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      updatedBy: user.usernameIdp,
      ...validData,
    });
    expect(id).toBeTruthy();
  });

  it('should not create without algorithm', async () => {
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    let data = Object.assign({}, validData);
    data.algorithm = null;
    let id = await service._insert(data, user, xact);
    expect(MockModel.insert).toBeCalledTimes(0);
    expect(id).toBeFalsy();
  });

  it('should not create without key', async () => {
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    let data = Object.assign({}, validData);
    data.key = null;
    let id = await service._insert(data, user, xact);
    expect(MockModel.insert).toBeCalledTimes(0);
    expect(id).toBeFalsy();
  });

  it('should raise errors on failed insert', async () => {
    MockModel.insert = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    await expect(service._insert(validData, user, xact)).rejects.toThrow();
  });
});

describe('upsertForEventStreamConfig', () => {
  beforeEach(() => {
    MockModel.mockClear();
    MockModel.mockReset();
    MockTransaction.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update valid data', async () => {
    MockModel.first = jest.fn().mockResolvedValue(Object.assign({}, validData));
    MockModel.findById = jest.fn().mockReturnThis();

    let data = Object.assign({}, validData);
    data.key = 'differentkey';

    await service.upsertForEventStreamConfig(validData.formId, data, user);
    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: user.usernameIdp,
      ...data,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should create when not found', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    service._initModel = jest.fn().mockReturnValue(validData);
    await service.upsertForEventStreamConfig(validData.formId, validData, user);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      updatedBy: user.usernameIdp,
      ...validData,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should raise errors on failed update', async () => {
    MockModel.first = jest.fn().mockResolvedValue(Object.assign({}, validData));
    MockModel.update = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));

    let data = Object.assign({}, validData);
    data.key = 'differentkey';

    await expect(service.upsertForEventStreamConfig(validData.formId, data, user)).rejects.toThrow();
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });

  it('should raise errors on failed insert', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    MockModel.insert = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.upsertForEventStreamConfig(validData.formId, validData, user)).rejects.toThrow();
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });

  it('should use provided transaction', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    service._initModel = jest.fn().mockReturnValue(validData);
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    await service.upsertForEventStreamConfig(validData.formId, validData, user, xact);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      updatedBy: user.usernameIdp,
      ...validData,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });
});
