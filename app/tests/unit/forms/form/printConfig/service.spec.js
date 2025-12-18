const Problem = require('api-problem');
const uuid = require('uuid');

const service = require('../../../../../src/forms/form/printConfig/service');
const { PrintConfigTypes } = require('../../../../../src/forms/common/constants');

const currentUser = {
  usernameIdp: 'TESTER',
};

const formId = uuid.v4();
const templateId = uuid.v4();

const mockTypeCode = {
  code: PrintConfigTypes.DIRECT,
  display: 'Direct',
};

const mockTemplate = {
  id: templateId,
  formId: formId,
  active: true,
  filename: 'test-template.docx',
};

const mockPrintConfig = {
  id: uuid.v4(),
  formId: formId,
  code: PrintConfigTypes.DIRECT,
  templateId: templateId,
  outputFileType: 'pdf',
  createdBy: currentUser.usernameIdp,
};

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

const queryHelpers = service._queryHelpers;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('validatePrintConfig', () => {
  it('throws when data is null', async () => {
    await expect(service.validatePrintConfig(null)).rejects.toThrow(Problem);
    await expect(service.validatePrintConfig(null)).rejects.toThrow("'PrintConfig record' cannot be empty.");
  });

  it('throws when data is undefined', async () => {
    await expect(service.validatePrintConfig(undefined)).rejects.toThrow(Problem);
    await expect(service.validatePrintConfig(undefined)).rejects.toThrow("'PrintConfig record' cannot be empty.");
  });

  it('throws when code is missing', async () => {
    const data = {};
    await expect(service.validatePrintConfig(data)).rejects.toThrow(Problem);
    await expect(service.validatePrintConfig(data)).rejects.toThrow("'code' is required.");
  });

  it('throws when code is null', async () => {
    const data = { code: null };
    await expect(service.validatePrintConfig(data)).rejects.toThrow(Problem);
    await expect(service.validatePrintConfig(data)).rejects.toThrow("'code' is required.");
  });

  it('throws when code does not exist in code table', async () => {
    const data = { code: 'invalid-code' };
    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(null);

    await expect(service.validatePrintConfig(data)).rejects.toThrow(Problem);
    await expect(service.validatePrintConfig(data)).rejects.toThrow("'code' must be a valid print config type code.");
  });

  it('throws when code is direct but templateId is missing', async () => {
    const data = { code: PrintConfigTypes.DIRECT };
    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(mockTypeCode);

    await expect(service.validatePrintConfig(data)).rejects.toThrow(Problem);
    await expect(service.validatePrintConfig(data)).rejects.toThrow("'templateId' is required when code is 'direct'.");
  });

  it('throws when code is direct but templateId is null', async () => {
    const data = { code: PrintConfigTypes.DIRECT, templateId: null };
    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(mockTypeCode);

    await expect(service.validatePrintConfig(data)).rejects.toThrow(Problem);
    await expect(service.validatePrintConfig(data)).rejects.toThrow("'templateId' is required when code is 'direct'.");
  });

  it('defaults outputFileType to pdf when code is direct and outputFileType is missing', async () => {
    const data = { code: PrintConfigTypes.DIRECT, templateId: templateId };
    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(mockTypeCode);

    await service.validatePrintConfig(data);

    expect(data.outputFileType).toBe('pdf');
  });

  it('defaults outputFileType to pdf when code is direct and outputFileType is null', async () => {
    const data = { code: PrintConfigTypes.DIRECT, templateId: templateId, outputFileType: null };
    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(mockTypeCode);

    await service.validatePrintConfig(data);

    expect(data.outputFileType).toBe('pdf');
  });

  it('preserves outputFileType when code is direct and outputFileType is provided', async () => {
    const data = { code: PrintConfigTypes.DIRECT, templateId: templateId, outputFileType: 'docx' };
    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(mockTypeCode);

    await service.validatePrintConfig(data);

    expect(data.outputFileType).toBe('docx');
  });

  it('clears templateId and outputFileType when code is default', async () => {
    const data = { code: PrintConfigTypes.DEFAULT, templateId: templateId, outputFileType: 'pdf' };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);

    await service.validatePrintConfig(data);

    expect(data.templateId).toBeNull();
    expect(data.outputFileType).toBeNull();
  });

  it('succeeds when code is direct with all required fields', async () => {
    const data = { code: PrintConfigTypes.DIRECT, templateId: templateId, outputFileType: 'pdf' };
    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(mockTypeCode);

    await expect(service.validatePrintConfig(data)).resolves.toBeUndefined();
  });

  it('succeeds when code is default', async () => {
    const data = { code: PrintConfigTypes.DEFAULT };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);

    await expect(service.validatePrintConfig(data)).resolves.toBeUndefined();
  });
});

describe('validateTemplate', () => {
  it('throws when templateId is missing', async () => {
    await expect(service.validateTemplate(formId, null)).rejects.toThrow(Problem);
    await expect(service.validateTemplate(formId, null)).rejects.toThrow("'templateId' is required.");
  });

  it('throws when templateId is undefined', async () => {
    await expect(service.validateTemplate(formId, undefined)).rejects.toThrow(Problem);
    await expect(service.validateTemplate(formId, undefined)).rejects.toThrow("'templateId' is required.");
  });

  it('throws when template is not found', async () => {
    queryHelpers.findTemplateById = jest.fn().mockResolvedValue(null);

    await expect(service.validateTemplate(formId, templateId)).rejects.toThrow(Problem);
    await expect(service.validateTemplate(formId, templateId)).rejects.toThrow('Template not found, inactive, or does not belong to the specified form.');
  });

  it('handles error when findById throws and catch returns null', async () => {
    queryHelpers.findTemplateById = jest.fn().mockResolvedValue(null);

    await expect(service.validateTemplate(formId, templateId)).rejects.toThrow(Problem);
    await expect(service.validateTemplate(formId, templateId)).rejects.toThrow('Template not found, inactive, or does not belong to the specified form.');
  });

  it('returns template when found and active', async () => {
    queryHelpers.findTemplateById = jest.fn().mockResolvedValue(mockTemplate);

    const result = await service.validateTemplate(formId, templateId);

    expect(result).toEqual(mockTemplate);
  });

  it('calls findTemplateById with correct parameters', async () => {
    queryHelpers.findTemplateById = jest.fn().mockResolvedValue(mockTemplate);

    await service.validateTemplate(formId, templateId);

    expect(queryHelpers.findTemplateById).toHaveBeenCalledWith(formId, templateId);
  });
});

describe('readPrintConfig', () => {
  it('returns null when no config exists', async () => {
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValue(null);

    const result = await service.readPrintConfig(formId);

    expect(result).toBeNull();
  });

  it('returns config when found', async () => {
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValue(mockPrintConfig);

    const result = await service.readPrintConfig(formId);

    expect(result).toEqual(mockPrintConfig);
  });

  it('calls findPrintConfigByFormId with formId', async () => {
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValue(mockPrintConfig);

    await service.readPrintConfig(formId);

    expect(queryHelpers.findPrintConfigByFormId).toHaveBeenCalledWith(formId);
  });
});

describe('upsert', () => {
  it('creates new config when none exists', async () => {
    const data = { code: PrintConfigTypes.DEFAULT };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    const newConfig = { ...mockPrintConfig, code: PrintConfigTypes.DEFAULT, templateId: null, outputFileType: null };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);
    queryHelpers.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(newConfig);
    queryHelpers.createPrintConfig = jest.fn().mockResolvedValue(newConfig);

    const result = await service.upsert(formId, data, currentUser);

    expect(result).toEqual(newConfig);
    expect(queryHelpers.createPrintConfig).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
  });

  it('updates existing config', async () => {
    const data = { code: PrintConfigTypes.DIRECT, templateId: templateId, outputFileType: 'pdf' };
    const updatedConfig = { ...mockPrintConfig, code: PrintConfigTypes.DIRECT };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(mockTypeCode);
    queryHelpers.findTemplateById = jest.fn().mockResolvedValue(mockTemplate);
    queryHelpers.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValueOnce(mockPrintConfig).mockResolvedValueOnce(updatedConfig);
    queryHelpers.updatePrintConfig = jest.fn().mockResolvedValue(updatedConfig);

    const result = await service.upsert(formId, data, currentUser);

    expect(result).toEqual(updatedConfig);
    expect(queryHelpers.updatePrintConfig).toHaveBeenCalledWith(
      mockPrintConfig.id,
      {
        code: PrintConfigTypes.DIRECT,
        templateId: templateId,
        outputFileType: 'pdf',
        updatedBy: currentUser.usernameIdp,
      },
      mockTransaction
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
  });

  it('validates template when code is direct', async () => {
    const data = { code: PrintConfigTypes.DIRECT, templateId: templateId, outputFileType: 'pdf' };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(mockTypeCode);
    queryHelpers.findTemplateById = jest.fn().mockResolvedValue(mockTemplate);
    queryHelpers.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(mockPrintConfig);
    queryHelpers.createPrintConfig = jest.fn().mockResolvedValue(mockPrintConfig);

    await service.upsert(formId, data, currentUser);

    expect(queryHelpers.findTemplateById).toHaveBeenCalledWith(formId, templateId);
  });

  it('does not validate template when code is default', async () => {
    const data = { code: PrintConfigTypes.DEFAULT };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    const newConfig = { ...mockPrintConfig, code: PrintConfigTypes.DEFAULT, templateId: null, outputFileType: null };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);
    queryHelpers.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(newConfig);
    queryHelpers.createPrintConfig = jest.fn().mockResolvedValue(newConfig);
    queryHelpers.findTemplateById = jest.fn();

    await service.upsert(formId, data, currentUser);

    expect(queryHelpers.findTemplateById).not.toHaveBeenCalled();
  });

  it('uses external transaction when provided', async () => {
    const data = { code: PrintConfigTypes.DEFAULT };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    const externalTransaction = { commit: jest.fn(), rollback: jest.fn() };
    const newConfig = { ...mockPrintConfig, code: PrintConfigTypes.DEFAULT };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(newConfig);
    queryHelpers.createPrintConfig = jest.fn().mockResolvedValue(newConfig);

    const result = await service.upsert(formId, data, currentUser, externalTransaction);

    expect(result).toEqual(newConfig);
    expect(queryHelpers.startTransaction).not.toHaveBeenCalled();
    expect(externalTransaction.commit).not.toHaveBeenCalled();
    expect(externalTransaction.rollback).not.toHaveBeenCalled();
  });

  it('rolls back transaction on error when using internal transaction', async () => {
    const data = { code: PrintConfigTypes.DEFAULT };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    const error = new Error('Database error');

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);
    queryHelpers.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockRejectedValue(error);

    await expect(service.upsert(formId, data, currentUser)).rejects.toThrow('Database error');

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });

  it('does not rollback external transaction on error', async () => {
    const data = { code: PrintConfigTypes.DEFAULT };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    const externalTransaction = { commit: jest.fn(), rollback: jest.fn() };
    const error = new Error('Database error');

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockRejectedValue(error);

    await expect(service.upsert(formId, data, currentUser, externalTransaction)).rejects.toThrow('Database error');

    expect(externalTransaction.rollback).not.toHaveBeenCalled();
    expect(externalTransaction.commit).not.toHaveBeenCalled();
  });

  it('throws validation error when print config validation fails', async () => {
    const data = { code: 'invalid-code' };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(null);

    await expect(service.upsert(formId, data, currentUser)).rejects.toThrow(Problem);
    expect(queryHelpers.startTransaction).not.toHaveBeenCalled();
  });

  it('throws validation error when template validation fails for direct code', async () => {
    const data = { code: PrintConfigTypes.DIRECT, templateId: templateId, outputFileType: 'pdf' };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(mockTypeCode);
    queryHelpers.findTemplateById = jest.fn().mockResolvedValue(null);
    queryHelpers.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValueOnce(null);

    await expect(service.upsert(formId, data, currentUser)).rejects.toThrow(Problem);
    await expect(service.upsert(formId, data, currentUser)).rejects.toThrow('Template not found, inactive, or does not belong to the specified form.');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('sets createdBy when creating new config', async () => {
    const data = { code: PrintConfigTypes.DEFAULT };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    const newConfig = { ...mockPrintConfig, code: PrintConfigTypes.DEFAULT };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);
    queryHelpers.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(newConfig);
    queryHelpers.createPrintConfig = jest.fn().mockResolvedValue(newConfig);

    await service.upsert(formId, data, currentUser);

    expect(queryHelpers.createPrintConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: currentUser.usernameIdp,
        formId: formId,
        code: PrintConfigTypes.DEFAULT,
      }),
      mockTransaction
    );
  });

  it('sets updatedBy when updating existing config', async () => {
    const data = { code: PrintConfigTypes.DEFAULT };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    const updatedConfig = { ...mockPrintConfig, code: PrintConfigTypes.DEFAULT };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);
    queryHelpers.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValueOnce(mockPrintConfig).mockResolvedValueOnce(updatedConfig);
    queryHelpers.updatePrintConfig = jest.fn().mockResolvedValue(updatedConfig);

    await service.upsert(formId, data, currentUser);

    expect(queryHelpers.updatePrintConfig).toHaveBeenCalledWith(
      mockPrintConfig.id,
      expect.objectContaining({
        updatedBy: currentUser.usernameIdp,
      }),
      mockTransaction
    );
  });

  it('generates uuid for new config id', async () => {
    const data = { code: PrintConfigTypes.DEFAULT };
    const defaultTypeCode = { code: PrintConfigTypes.DEFAULT, display: 'Default' };
    const newConfig = { ...mockPrintConfig, code: PrintConfigTypes.DEFAULT };

    queryHelpers.findTypeCodeById = jest.fn().mockResolvedValue(defaultTypeCode);
    queryHelpers.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
    queryHelpers.findPrintConfigByFormId = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(newConfig);
    queryHelpers.createPrintConfig = jest.fn().mockResolvedValue(newConfig);

    await service.upsert(formId, data, currentUser);

    expect(queryHelpers.createPrintConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
      }),
      mockTransaction
    );
    expect(uuid.validate(queryHelpers.createPrintConfig.mock.calls[0][0].id)).toBe(true);
  });
});
