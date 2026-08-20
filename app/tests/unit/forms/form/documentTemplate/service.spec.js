const Problem = require('api-problem');
const { MockModel, MockTransaction } = require('../../../../common/dbHelper');

const uuid = require('uuid');

const service = require('../../../../../src/forms/form/documentTemplate/service');

jest.mock('../../../../../src/forms/common/models/tables/documentTemplate', () => MockModel);

jest.mock('../../../../../src/forms/common/models/tables/formPrintConfig', () => {
  const mockModel = {
    query: jest.fn().mockReturnThis(),
    modify: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
  };
  return mockModel;
});

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

// Get the mocked FormPrintConfig after jest.mock has run
const getMockPrintConfigModel = () => {
  return require('../../../../../src/forms/common/models/tables/formPrintConfig');
};

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
  const MockPrintConfig = getMockPrintConfigModel();
  MockPrintConfig.query.mockReturnThis();
  MockPrintConfig.modify.mockReturnThis();
  MockPrintConfig.where.mockReturnThis();
  MockPrintConfig.first.mockResolvedValue(null);
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
  it('should throw Problem when template is in use by PrintConfig', async () => {
    const MockPrintConfig = getMockPrintConfigModel();
    const printConfig = {
      id: uuid.v4(),
      formId: formId,
      templateId: documentTemplateId,
    };
    MockPrintConfig.first.mockResolvedValueOnce(printConfig);

    await expect(service.documentTemplateDelete(formId, documentTemplateId, currentUser.usernameIdp)).rejects.toThrow(Problem);

    expect(MockPrintConfig.query).toBeCalledTimes(1);
    expect(MockPrintConfig.modify).toBeCalledWith('filterFormId', formId);
    expect(MockPrintConfig.where).toBeCalledWith('templateId', documentTemplateId);
    expect(MockPrintConfig.first).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
  });

  it('should not roll back transaction create problems', async () => {
    const error = new Error('error');
    MockModel.startTransaction.mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.documentTemplateDelete(formId, documentTemplateId, currentUser.usernameIdp)).rejects.toThrow(error);

    expect(MockTransaction.commit).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(0);
  });

  it('should propagate database errors', async () => {
    const error = new Error('error');
    MockModel.patchAndFetchById.mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.documentTemplateDelete(formId, documentTemplateId, currentUser.usernameIdp)).rejects.toThrow(error);

    expect(MockTransaction.commit).toBeCalledTimes(0);
    expect(MockTransaction.rollback).toBeCalledTimes(1);
  });

  it('should update database when template is not in use', async () => {
    MockModel.mockResolvedValue(documentTemplate);
    const MockPrintConfig = getMockPrintConfigModel();

    await service.documentTemplateDelete(formId, documentTemplateId, currentUser.usernameIdp);

    expect(MockPrintConfig.query).toBeCalledTimes(1);
    expect(MockPrintConfig.modify).toBeCalledWith('filterFormId', formId);
    expect(MockPrintConfig.where).toBeCalledWith('templateId', documentTemplateId);
    expect(MockPrintConfig.first).toBeCalledTimes(1);
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
