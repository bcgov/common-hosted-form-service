jest.mock('../../../../src/components/log');
jest.mock('../../../../src/components/eventStreamService');
jest.mock('config');

describe('recordsManagement service', () => {
  let service;
  let localService;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked modules
    config = require('config');

    // Setup config mocks
    config.has = jest.fn().mockReturnValue(true);
    config.get = jest.fn().mockReturnValue('local');

    // Mock submission service BEFORE requiring localService
    jest.doMock(
      '../../../../src/forms/submission/service',
      () => ({
        deleteSubmissionAndRelatedData: jest.fn().mockResolvedValue({ success: true }),
      }),
      { virtual: true }
    );

    // Require services after all mocks are configured
    require('../../../../src/forms/submission/service');
    localService = require('../../../../src/forms/recordsManagement/localService');
    service = require('../../../../src/forms/recordsManagement/service');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.unmock('../../../../src/forms/submission/service');
  });

  describe('getRetentionPolicy', () => {
    it('should delegate to localService when implementation is local', async () => {
      const formId = 'form-123';
      localService.getRetentionPolicy = jest.fn().mockResolvedValue({ formId, retentionDays: 365 });

      const result = await service.getRetentionPolicy(formId);

      expect(localService.getRetentionPolicy).toHaveBeenCalledWith(formId);
      expect(result).toEqual({ formId, retentionDays: 365 });
    });

    it('should throw error for unknown implementation', async () => {
      const formId = 'form-123';
      localService.getRetentionPolicy = jest.fn().mockRejectedValue(new Error("RecordsManagement implementation 'unknown' not available"));

      await expect(service.getRetentionPolicy(formId)).rejects.toThrow("RecordsManagement implementation 'unknown' not available");
    });
  });

  describe('configureRetentionPolicy', () => {
    it('should delegate to localService', async () => {
      const formId = 'form-123';
      const policyData = { retentionDays: 730 };
      const user = 'testuser';

      localService.configureRetentionPolicy = jest.fn().mockResolvedValue(policyData);

      const result = await service.configureRetentionPolicy(formId, policyData, user);

      expect(localService.configureRetentionPolicy).toHaveBeenCalledWith(formId, policyData, user);
      expect(result).toEqual(policyData);
    });
  });

  describe('scheduleDeletion', () => {
    it('should delegate to localService', async () => {
      const submissionId = 'sub-123';
      const formId = 'form-123';
      const user = 'testuser';

      localService.scheduleDeletion = jest.fn().mockResolvedValue({ submissionId, status: 'pending' });

      const result = await service.scheduleDeletion(submissionId, formId, user);

      expect(localService.scheduleDeletion).toHaveBeenCalledWith(submissionId, formId, user);
      expect(result).toEqual({ submissionId, status: 'pending' });
    });
  });

  describe('cancelDeletion', () => {
    it('should delegate to localService', async () => {
      const submissionId = 'sub-123';

      localService.cancelDeletion = jest.fn().mockResolvedValue({ submissionId, cancelled: true });

      const result = await service.cancelDeletion(submissionId);

      expect(localService.cancelDeletion).toHaveBeenCalledWith(submissionId);
      expect(result).toEqual({ submissionId, cancelled: true });
    });
  });

  describe('processDeletions', () => {
    it('should delegate to localService', async () => {
      localService.processDeletions = jest.fn().mockResolvedValue({ processed: 10, results: [] });

      const result = await service.processDeletions(100);

      expect(localService.processDeletions).toHaveBeenCalledWith(100);
      expect(result).toEqual({ processed: 10, results: [] });
    });
  });

  describe('hardDeleteSubmissions', () => {
    it('should delegate to localService', async () => {
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
});
