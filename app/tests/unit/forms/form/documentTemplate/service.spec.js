const { MockModel, MockTransaction } = require('../../../../common/dbHelper');

const uuid = require('uuid');

const service = require('../../../../../src/forms/form/documentTemplate/service');

jest.mock('../../../../../src/forms/common/models/tables/documentTemplate', () => MockModel);

const documentTemplateId = uuid.v4();
const formId = uuid.v4();

const currentUser = {
  usernameIdp: 'TESTER',
};

const documentTemplate = {
  filename: 'cdogs_template.txt',
  formId: formId,
  id: documentTemplateId,
  template: 'My Template',
};

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('documentTemplateCreate', () => {
  // Need to temporarily replace calls to other functions within the module -
  // they will be tested elsewhere.
  beforeEach(() => {
    jest.spyOn(service, 'documentTemplateRead').mockImplementation(() => documentTemplate);
  });

  it('should not roll back transaction create problems', async () => {
    const error = new Error('error');
    MockModel.startTransaction.mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.documentTemplateCreate(formId, documentTemplate, currentUser.usernameIdp)).rejects.toThrow(error);

    expect(MockTransaction.commit).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
  });

  it('should propagate database errors', async () => {
    const error = new Error('error');
    MockModel.insert.mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.documentTemplateCreate(formId, documentTemplate, currentUser.usernameIdp)).rejects.toThrow(error);

    expect(MockTransaction.commit).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
  });

  it('should update database', async () => {
    MockModel.mockResolvedValue(documentTemplate);
    const newDocumentTemplate = { ...documentTemplate };
    delete newDocumentTemplate.id;

    await service.documentTemplateCreate(formId, newDocumentTemplate, currentUser.usernameIdp);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(MockTransaction);
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith(
      expect.objectContaining({
        ...newDocumentTemplate,
        createdBy: currentUser.usernameIdp,
      })
    );
    expect(MockTransaction.commit).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
  });
});

describe('documentTemplateDelete', () => {
  it('should not roll back transaction create problems', async () => {
    const error = new Error('error');
    MockModel.startTransaction.mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.documentTemplateDelete(documentTemplateId, currentUser.usernameIdp)).rejects.toThrow(error);

    expect(MockTransaction.commit).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
  });

  it('should propagate database errors', async () => {
    const error = new Error('error');
    MockModel.patchAndFetchById.mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.documentTemplateDelete(documentTemplateId, currentUser.usernameIdp)).rejects.toThrow(error);

    expect(MockTransaction.commit).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
  });

  it('should update database', async () => {
    MockModel.mockResolvedValue(documentTemplate);

    await service.documentTemplateDelete(documentTemplateId, currentUser.usernameIdp);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(MockTransaction);
    expect(MockModel.patchAndFetchById).toBeCalledTimes(1);
    expect(MockModel.patchAndFetchById).toBeCalledWith(
      documentTemplateId,
      expect.objectContaining({
        active: false,
        updatedBy: currentUser.usernameIdp,
      })
    );
    expect(MockTransaction.commit).toBeCalledTimes(1);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
  });
});

describe('documentTemplateList', () => {
  it('should propagate database errors', async () => {
    const error = new Error('error');
    MockModel.query.mockImplementationOnce(() => {
      throw error;
    });

    expect(service.documentTemplateList).toThrow(error);
  });

  it('should query database', async () => {
    MockModel.mockResolvedValue([documentTemplate]);

    const result = await service.documentTemplateList(formId);

    expect(result).toEqual([documentTemplate]);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith();
    expect(MockModel.modify).toBeCalledTimes(2);
    expect(MockModel.modify).toBeCalledWith('filterActive', true);
    expect(MockModel.modify).toBeCalledWith('filterFormId', formId);
  });
});

describe('documentTemplateRead', () => {
  it('should propagate database errors', async () => {
    const error = new Error('error');
    MockModel.query.mockImplementationOnce(() => {
      throw error;
    });

    expect(service.documentTemplateRead).toThrow(error);
  });

  it('should query database', async () => {
    MockModel.mockResolvedValue(documentTemplate);

    const result = await service.documentTemplateRead(documentTemplateId);

    expect(result).toEqual(documentTemplate);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith();
    expect(MockModel.findById).toBeCalledTimes(1);
    expect(MockModel.findById).toBeCalledWith(documentTemplateId);
    expect(MockModel.modify).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledWith('filterActive', true);
    expect(MockModel.throwIfNotFound).toBeCalledTimes(1);
  });
});
