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
    expect(res.metadata).toEqual({});
  });

  it('should init with existing values 422 with no data', () => {
    const res = service.initModel('123', {
      metadata: { externalId: '456' },
    });
    expect(res.id).toBeTruthy();
    expect(res.formId).toEqual('123');
    expect(res.metadata).toEqual({ externalId: '456' });
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

describe('hasMetadata', () => {
  it('return true when metadata has keys', async () => {
    const result = await service.hasMetadata({ metadata: { a: 'b' } });
    expect(result).toBeTruthy();
  });

  it('return false when no object', async () => {
    const result = await service.hasMetadata();
    expect(result).toBeFalsy();
  });

  it('return false when no metadata', async () => {
    const result = await service.hasMetadata({});
    expect(result).toBeFalsy();
  });

  it('return false when  metadata has no keys', async () => {
    const result = await service.hasMetadata({ metadata: {} });
    expect(result).toBeFalsy();
  });
});

describe('addMetadataToObject', () => {
  let validData;
  beforeEach(() => {
    // no idea why MockModel wasn't working in this test, so just use the model directly
    FormMetadata.query = jest.fn().mockReturnThis();
    FormMetadata.where = jest.fn().mockReturnThis();
    FormMetadata.modify = jest.fn().mockReturnThis();
    FormMetadata.first = jest.fn().mockReturnThis();
    FormMetadata.deleteById = jest.fn();
    FormMetadata.throwIfNotFound = jest.fn().mockReturnThis();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      metadata: { externalId: '456' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should do nothing if no formid', async () => {
    let obj = {};
    await service.addMetadataToObject(null, obj, 'name');
    expect(FormMetadata.query).not.toBeCalled();
    expect(obj).toEqual({});
  });

  it('should do nothing if no data', async () => {
    await service.addMetadataToObject('123', null, 'name');
    expect(FormMetadata.query).not.toBeCalled();
  });

  it('should do nothing if no name', async () => {
    let obj = {};
    await service.addMetadataToObject('formId', obj, null);
    expect(FormMetadata.query).not.toBeCalled();
    expect(obj).toEqual({});
  });

  it('should do nothing if invalid name', async () => {
    let obj = {};
    await service.addMetadataToObject('formId', obj, 'badname');
    expect(FormMetadata.query).not.toBeCalled();
    expect(obj).toEqual({});
  });

  it('should do nothing if no data is not an object', async () => {
    await service.addMetadataToObject('123', 123, 'formMetadata');
    expect(FormMetadata.query).not.toBeCalled();
    await service.addMetadataToObject('123', [], 'formMetadata');
    expect(FormMetadata.query).not.toBeCalled();
  });

  it('should do nothing if formMetadata is not found', async () => {
    FormMetadata.first = jest.fn().mockResolvedValueOnce(null);
    let obj = {};
    await service.addMetadataToObject('123', obj, 'formMetadata');
    expect(FormMetadata.query).toBeCalledTimes(1);
    expect(FormMetadata.first).toBeCalledTimes(1);
    expect(obj).toEqual({});
  });

  it('should add metadata as attributeName', async () => {
    FormMetadata.first = jest.fn().mockResolvedValueOnce(validData);
    let obj = {};
    await service.addMetadataToObject('123', obj, 'formMetadata');
    expect(FormMetadata.query).toBeCalledTimes(1);
    expect(FormMetadata.first).toBeCalledTimes(1);
    expect(obj).toEqual({ formMetadata: { externalId: '456' } });
  });

  it('should add metadata as headerName', async () => {
    FormMetadata.first = jest.fn().mockResolvedValueOnce(validData);
    let obj = {};
    await service.addMetadataToObject('123', obj, 'X-FORM-METADATA');
    expect(FormMetadata.query).toBeCalledTimes(1);
    expect(FormMetadata.first).toBeCalledTimes(1);
    expect(obj).toEqual({ 'X-FORM-METADATA': { externalId: '456' } });
  });

  it('should add encoded metadata as headerName', async () => {
    FormMetadata.first = jest.fn().mockResolvedValueOnce(validData);
    let bufferObj = Buffer.from(JSON.stringify(validData.metadata), 'utf8');
    let encodedValue = bufferObj.toString('base64');

    let obj = {};
    await service.addMetadataToObject('123', obj, 'X-FORM-METADATA', true);
    expect(FormMetadata.query).toBeCalledTimes(1);
    expect(FormMetadata.first).toBeCalledTimes(1);
    expect(obj['X-FORM-METADATA']).toMatch(encodedValue);
  });
});

describe('addAttribute', () => {
  let validData;
  beforeEach(() => {
    // no idea why MockModel wasn't working in this test, so just use the model directly
    FormMetadata.query = jest.fn().mockReturnThis();
    FormMetadata.where = jest.fn().mockReturnThis();
    FormMetadata.modify = jest.fn().mockReturnThis();
    FormMetadata.first = jest.fn().mockReturnThis();
    FormMetadata.deleteById = jest.fn();
    FormMetadata.throwIfNotFound = jest.fn().mockReturnThis();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      metadata: { externalId: '456' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should do nothing if no formid', async () => {
    let obj = {};
    await service.addAttribute(null, obj);
    expect(FormMetadata.query).not.toBeCalled();
    expect(obj).toEqual({});
  });

  it('should do nothing if no data', async () => {
    await service.addAttribute('123', null);
    expect(FormMetadata.query).not.toBeCalled();
  });

  it('should do nothing if no data is not an object', async () => {
    await service.addAttribute('123', 123);
    expect(FormMetadata.query).not.toBeCalled();
    await service.addAttribute('123', []);
    expect(FormMetadata.query).not.toBeCalled();
  });

  it('should do nothing if formMetadata is not found', async () => {
    FormMetadata.first = jest.fn().mockResolvedValueOnce(null);
    let obj = {};
    await service.addAttribute('123', obj);
    expect(FormMetadata.query).toBeCalledTimes(1);
    expect(FormMetadata.first).toBeCalledTimes(1);
    expect(obj).toEqual({});
  });

  it('should add metadata as attributeName', async () => {
    FormMetadata.first = jest.fn().mockResolvedValueOnce(validData);
    let obj = {};
    await service.addAttribute('123', obj);
    expect(FormMetadata.query).toBeCalledTimes(1);
    expect(FormMetadata.first).toBeCalledTimes(1);
    expect(obj).toEqual({ formMetadata: { externalId: '456' } });
  });
});

describe('addHeader', () => {
  let validData;
  beforeEach(() => {
    // no idea why MockModel wasn't working in this test, so just use the model directly
    FormMetadata.query = jest.fn().mockReturnThis();
    FormMetadata.where = jest.fn().mockReturnThis();
    FormMetadata.modify = jest.fn().mockReturnThis();
    FormMetadata.first = jest.fn().mockReturnThis();
    FormMetadata.deleteById = jest.fn();
    FormMetadata.throwIfNotFound = jest.fn().mockReturnThis();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      metadata: { externalId: '456' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should do nothing if no formid', async () => {
    let obj = {};
    await service.addHeader(null, obj);
    expect(FormMetadata.query).not.toBeCalled();
    expect(obj).toEqual({});
  });

  it('should do nothing if no data', async () => {
    await service.addHeader('123', null);
    expect(FormMetadata.query).not.toBeCalled();
  });

  it('should do nothing if no data is not an object', async () => {
    await service.addHeader('123', 123);
    expect(FormMetadata.query).not.toBeCalled();
    await service.addHeader('123', []);
    expect(FormMetadata.query).not.toBeCalled();
  });

  it('should do nothing if formMetadata is not found', async () => {
    FormMetadata.first = jest.fn().mockResolvedValueOnce(null);
    let obj = {};
    await service.addHeader('123', obj);
    expect(FormMetadata.query).toBeCalledTimes(1);
    expect(FormMetadata.first).toBeCalledTimes(1);
    expect(obj).toEqual({});
  });

  it('should add encoded metadata as headerName', async () => {
    FormMetadata.first = jest.fn().mockResolvedValueOnce(validData);
    let bufferObj = Buffer.from(JSON.stringify(validData.metadata), 'utf8');
    let encodedValue = bufferObj.toString('base64');

    let obj = {};
    await service.addHeader('123', obj);
    expect(FormMetadata.query).toBeCalledTimes(1);
    expect(FormMetadata.first).toBeCalledTimes(1);
    expect(obj['X-FORM-METADATA']).toMatch(encodedValue);
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

describe('_update', () => {
  const user = { usernameIdp: 'username' };
  let validData = null;

  beforeEach(() => {
    MockModel.mockClear();
    MockModel.mockReset();
    MockTransaction.mockReset();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      metadata: { externalId: '456' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update valid data', async () => {
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    await service._update(validData, validData, user, xact);
    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: user.usernameIdp,
      ...validData,
    });
  });

  it('should raise errors on failed update', async () => {
    MockModel.update = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    await expect(service._update(validData, validData, user, xact)).rejects.toThrow();
  });
});

describe('_insert', () => {
  const user = { usernameIdp: 'username' };
  let validData = null;

  beforeEach(() => {
    MockModel.mockClear();
    MockModel.mockReset();
    MockTransaction.mockReset();
    validData = {
      id: uuid.v4(),
      formId: uuid.v4(),
      metadata: { externalId: '456' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create with good data', async () => {
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    service.initModel = jest.fn().mockReturnValue(validData);
    await service._insert(validData.formId, validData, user, xact);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      ...validData,
    });
  });

  it('should raise errors on failed insert', async () => {
    MockModel.insert = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    const xact = jest.fn().mockResolvedValue(MockTransaction);
    await expect(service._insert(validData.formId, validData, user, xact)).rejects.toThrow();
  });
});
