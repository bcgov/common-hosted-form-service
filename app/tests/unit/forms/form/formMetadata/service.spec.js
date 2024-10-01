const { MockModel, MockTransaction } = require('../../../../common/dbHelper');

const uuid = require('uuid');

const service = require('../../../../../src/forms/form/formMetadata/service');
const { FormMetadata } = require('../../../../../src/forms/common/models');

jest.mock('../../../../../src/forms/common/models/tables/formMetadata', () => MockModel);

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('validate', () => {
  let validData = null;
  beforeEach(() => {
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      headerName: 'X-FORM-METADATA',
      attributeName: 'formMetadata',
      metadata: { externalId: '456' },
    };
  });
  it('should not throw errors with valid data', () => {
    service.validate(validData);
  });

  it('should throw 422 with no data', () => {
    expect(() => service.validate(undefined)).toThrow();
  });
});

describe('initModel', () => {
  it('should init with defaults', () => {
    const res = service.initModel('123', {});
    expect(res.id).toBeTruthy();
    expect(res.formId).toEqual('123');
    expect(res.headerName).toEqual('X-FORM-METADATA');
    expect(res.attributeName).toEqual('formMetadata');
    expect(res.metadata).toEqual({});
  });

  it('should init with existing values 422 with no data', () => {
    const res = service.initModel('123', {
      headerName: 'XX-FORM-METADATA',
      attributeName: 'xformMetadata',
      metadata: { externalId: '456' },
    });
    expect(res.id).toBeTruthy();
    expect(res.formId).toEqual('123');
    expect(res.headerName).toEqual('XX-FORM-METADATA');
    expect(res.attributeName).toEqual('xformMetadata');
    expect(res.metadata).toEqual({ externalId: '456' });
  });
});

describe('read', () => {
  const user = { usernameIdp: 'username' };
  let validData = null;

  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      headerName: 'X-FORM-METADATA',
      attributeName: 'formMetadata',
      metadata: { externalId: '456' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return valid data', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(validData);
    const res = await service.read(validData.formId, validData, user);
    expect(MockModel.first).toBeCalledTimes(1);
    expect(res).toEqual(validData);
  });
});

describe('create', () => {
  const user = { usernameIdp: 'username' };
  let validData = null;

  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      headerName: 'X-FORM-METADATA',
      attributeName: 'formMetadata',
      metadata: { externalId: '456' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should insert valid data', async () => {
    validData.id = null;
    service.initModel = jest.fn().mockReturnValue(validData);
    await service.create(validData.formId, validData, user);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      ...validData,
    });
  });

  it('should raise errors', async () => {
    MockModel.insert = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.create(validData.formId, validData, user)).rejects.toThrow();
  });
});

describe('update', () => {
  const user = { usernameIdp: 'username' };
  let validData = null;

  beforeEach(() => {
    MockModel.mockClear();
    MockModel.mockReset();
    MockTransaction.mockReset();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      headerName: 'X-FORM-METADATA',
      attributeName: 'formMetadata',
      metadata: { externalId: '456' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update valid data', async () => {
    MockModel.first = jest.fn().mockResolvedValue(Object.assign({}, validData));

    await service.update(validData.formId, validData, user);
    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: user.usernameIdp,
      ...validData,
    });
  });

  it('should create when not found', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    service.initModel = jest.fn().mockReturnValue(validData);
    await service.update(validData.formId, validData, user);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      ...validData,
    });
  });

  it('should raise errors', async () => {
    MockModel.first = jest.fn().mockResolvedValue(Object.assign({}, validData));
    MockModel.update = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.update(validData.formId, validData, user)).rejects.toThrow();
  });
});

describe('upsert', () => {
  const user = { usernameIdp: 'username' };
  let validData = null;

  beforeEach(() => {
    MockModel.mockClear();
    MockModel.mockReset();
    MockTransaction.mockReset();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      headerName: 'X-FORM-METADATA',
      attributeName: 'formMetadata',
      metadata: { externalId: '456' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update valid data', async () => {
    MockModel.first = jest.fn().mockResolvedValue(Object.assign({}, validData));

    await service.upsert(validData.formId, validData, user);
    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: user.usernameIdp,
      ...validData,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should create when not found', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    service.initModel = jest.fn().mockReturnValue(validData);
    await service.upsert(validData.formId, validData, user);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      ...validData,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should raise errors on failed update', async () => {
    MockModel.first = jest.fn().mockResolvedValue(Object.assign({}, validData));
    MockModel.update = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.upsert(validData.formId, validData, user)).rejects.toThrow();
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });

  it('should raise errors on failed insert', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    MockModel.insert = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.upsert(validData.formId, validData, user)).rejects.toThrow();
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });

  it('should use provided transaction', async () => {
    MockModel.first = jest.fn().mockResolvedValueOnce(null);
    service.initModel = jest.fn().mockReturnValue(validData);
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    await service.upsert(validData.formId, validData, user, xact);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      ...validData,
    });
    expect(MockModel.startTransaction).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
    expect(MockTransaction.commit).toBeCalledTimes(0);
  });
});

describe('delete', () => {
  beforeEach(() => {
    // no idea why MockModel wasn't working in this test, so just use the model directly
    FormMetadata.query = jest.fn().mockReturnThis();
    FormMetadata.where = jest.fn().mockReturnThis();
    FormMetadata.modify = jest.fn().mockReturnThis();
    FormMetadata.first = jest.fn().mockReturnThis();
    FormMetadata.deleteById = jest.fn();
    FormMetadata.throwIfNotFound = jest.fn().mockReturnThis();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delete valid data', async () => {
    FormMetadata.throwIfNotFound = jest.fn().mockResolvedValueOnce({ id: 123 });
    await service.delete('');
    expect(FormMetadata.deleteById).toBeCalledTimes(1);
  });

  it('should raise error when not found', async () => {
    FormMetadata.modify = jest.fn().mockReturnThis();
    FormMetadata.first = jest.fn().mockReturnThis();
    FormMetadata.throwIfNotFound = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await expect(service.delete('')).rejects.toThrow(); // throws but on reading return value
    expect(FormMetadata.deleteById).toBeCalledTimes(0);
  });
});
