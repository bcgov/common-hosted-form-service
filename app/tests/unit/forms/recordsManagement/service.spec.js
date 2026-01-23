jest.mock('../../../../src/components/log', () => () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));
jest.mock('../../../../src/components/eventStreamService', () => ({
  eventStreamService: {
    onSubmit: jest.fn(),
    onPublish: jest.fn(),
  },
  SUBMISSION_EVENT_TYPES: {},
}));
jest.mock('config');
jest.mock('../../../../src/components/chesService', () => ({
  send: jest.fn(),
  merge: jest.fn(),
  health: jest.fn(),
}));
jest.mock('../../../../src/forms/email/emailService', () => ({
  submissionReceived: jest.fn(),
}));
jest.mock('../../../../src/forms/file/service', () => ({
  read: jest.fn(),
  moveSubmissionFile: jest.fn(),
}));
jest.mock('../../../../src/forms/submission/service');

const service = require('../../../../src/forms/recordsManagement/service');
const localService = require('../../../../src/forms/recordsManagement/localService');
const config = require('config');

describe('recordsManagement service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.has = jest.fn().mockReturnValue(true);
    config.get = jest.fn().mockReturnValue('local');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getRetentionPolicy should delegate to localService when implementation is local', async () => {
    const formId = 'form-123';
    localService.getRetentionPolicy = jest.fn().mockResolvedValue({ formId, retentionDays: 365 });

    const result = await service.getRetentionPolicy(formId);

    expect(localService.getRetentionPolicy).toHaveBeenCalledWith(formId);
    expect(result).toEqual({ formId, retentionDays: 365 });
  });

  it('getRetentionPolicy should throw error for unknown implementation', async () => {
    const formId = 'form-123';
    localService.getRetentionPolicy = jest.fn().mockRejectedValue(new Error("RecordsManagement implementation 'unknown' not available"));

    await expect(service.getRetentionPolicy(formId)).rejects.toThrow("RecordsManagement implementation 'unknown' not available");
  });

  it('configureRetentionPolicy should delegate to localService', async () => {
    const formId = 'form-123';
    const policyData = { retentionDays: 730 };
    const user = 'testuser';

    localService.configureRetentionPolicy = jest.fn().mockResolvedValue(policyData);

    const result = await service.configureRetentionPolicy(formId, policyData, user);

    expect(localService.configureRetentionPolicy).toHaveBeenCalledWith(formId, policyData, user);
    expect(result).toEqual(policyData);
  });

  it('scheduleDeletion should delegate to localService', async () => {
    const submissionId = 'sub-123';
    const formId = 'form-123';
    const user = 'testuser';

    localService.scheduleDeletion = jest.fn().mockResolvedValue({ submissionId, status: 'pending' });

    const result = await service.scheduleDeletion(submissionId, formId, user);

    expect(localService.scheduleDeletion).toHaveBeenCalledWith(submissionId, formId, user);
    expect(result).toEqual({ submissionId, status: 'pending' });
  });

  it('cancelDeletion should delegate to localService', async () => {
    const submissionId = 'sub-123';

    localService.cancelDeletion = jest.fn().mockResolvedValue({ submissionId, cancelled: true });

    const result = await service.cancelDeletion(submissionId);

    expect(localService.cancelDeletion).toHaveBeenCalledWith(submissionId);
    expect(result).toEqual({ submissionId, cancelled: true });
  });

  it('processDeletions should delegate to localService', async () => {
    localService.processDeletions = jest.fn().mockResolvedValue({ processed: 10, results: [] });

    const result = await service.processDeletions(100);

    expect(localService.processDeletions).toHaveBeenCalledWith(100);
    expect(result).toEqual({ processed: 10, results: [] });
  });

  it('hardDeleteSubmissions should delegate to localService', async () => {
    const submissionIds = ['sub-1', 'sub-2'];

    localService.hardDeleteSubmissions = jest.fn().mockResolvedValue([
      { submissionId: 'sub-1', status: 'completed' },
      { submissionId: 'sub-2', status: 'completed' },
    ]);

    const result = await service.hardDeleteSubmissions(submissionIds);

    expect(localService.hardDeleteSubmissions).toHaveBeenCalledWith(submissionIds);
    expect(result).toHaveLength(2);
  });
});
