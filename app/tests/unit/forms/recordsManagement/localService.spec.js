const localService = require('../../../../src/forms/recordsManagement/localService');
const { RetentionPolicy, ScheduledSubmissionDeletion } = require('../../../../src/forms/common/models');
const submissionService = require('../../../../src/forms/submission/service');

jest.mock('../../../../src/forms/common/models');
jest.mock('../../../../src/forms/submission/service');

describe('localService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRetentionPolicy', () => {
    it('should return retention policy with classification', async () => {
      const formId = 'form-123';
      const mockPolicy = {
        formId,
        retentionDays: 365,
        classification: { code: 'public', display: 'Public' },
      };

      RetentionPolicy.query = jest.fn().mockReturnValue({
        findOne: jest.fn().mockReturnValue({
          withGraphFetched: jest.fn().mockResolvedValue(mockPolicy),
        }),
      });

      const result = await localService.getRetentionPolicy(formId);

      expect(result).toEqual(mockPolicy);
      expect(RetentionPolicy.query).toHaveBeenCalled();
    });

    it('should throw error if no policy found', async () => {
      const formId = 'form-456';
      RetentionPolicy.query = jest.fn().mockReturnValue({
        findOne: jest.fn().mockReturnValue({
          withGraphFetched: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(localService.getRetentionPolicy(formId)).rejects.toThrow(`No retention policy found for form ${formId}`);
    });
  });

  describe('configureRetentionPolicy', () => {
    it('should create new retention policy if not exists', async () => {
      const formId = 'form-123';
      const policyData = { retentionDays: 365, retentionClassificationId: 'class-123' };
      const user = 'testuser';

      const mockInsert = jest.fn().mockResolvedValue({ ...policyData, formId, createdBy: user });

      // First call: findOne() returns null (no existing policy)
      // Second call: insert() for new policy
      RetentionPolicy.query = jest
        .fn()
        .mockReturnValueOnce({
          findOne: jest.fn().mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const result = await localService.configureRetentionPolicy(formId, policyData, user);

      expect(result).toEqual({ ...policyData, formId, createdBy: user });
      expect(mockInsert).toHaveBeenCalledWith({
        formId,
        retentionDays: policyData.retentionDays,
        retentionClassificationId: policyData.retentionClassificationId,
        createdBy: user,
      });
    });

    it('should update existing retention policy', async () => {
      const formId = 'form-123';
      const policyData = { retentionDays: 730, retentionClassificationId: 'class-456' };
      const user = 'testuser';
      const existingPolicy = { id: 'policy-123', formId };

      const mockPatchAndFetchById = jest.fn().mockResolvedValue({
        id: 'policy-123',
        ...policyData,
        updatedBy: user,
      });

      // First call: findOne() returns existing policy
      // Second call: patchAndFetchById() for update
      RetentionPolicy.query = jest
        .fn()
        .mockReturnValueOnce({
          findOne: jest.fn().mockResolvedValue(existingPolicy),
        })
        .mockReturnValueOnce({
          patchAndFetchById: mockPatchAndFetchById,
        });

      const result = await localService.configureRetentionPolicy(formId, policyData, user);

      expect(result).toEqual({
        id: 'policy-123',
        ...policyData,
        updatedBy: user,
      });
      expect(mockPatchAndFetchById).toHaveBeenCalledWith('policy-123', {
        retentionDays: policyData.retentionDays,
        retentionClassificationId: policyData.retentionClassificationId,
        updatedBy: user,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('scheduleDeletion', () => {
    it('should schedule deletion with calculated eligibleForDeletionAt', async () => {
      const submissionId = 'sub-123';
      const formId = 'form-123';
      const user = 'testuser';
      const mockPolicy = {
        formId,
        retentionDays: 365,
        classification: { code: 'public' },
      };

      jest.spyOn(localService, 'getRetentionPolicy').mockResolvedValue(mockPolicy);

      const mockScheduled = {
        id: 'sched-123',
        submissionId,
        formId,
        status: 'pending',
        createdBy: user,
      };

      const mockInsert = jest.fn().mockResolvedValue(mockScheduled);
      ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      const result = await localService.scheduleDeletion(submissionId, formId, user);

      expect(result).toEqual(mockScheduled);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          submissionId,
          formId,
          status: 'pending',
          createdBy: user,
        })
      );
    });

    it('should handle indefinite retention (null retentionDays)', async () => {
      const submissionId = 'sub-456';
      const formId = 'form-456';
      const user = 'testuser';
      const mockPolicy = {
        formId,
        retentionDays: null,
        classification: { code: 'sensitive' },
      };

      jest.spyOn(localService, 'getRetentionPolicy').mockResolvedValue(mockPolicy);

      const mockInsert = jest.fn().mockResolvedValue({
        submissionId,
        formId,
        eligibleForDeletionAt: expect.any(Date),
        status: 'pending',
      });

      ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      await localService.scheduleDeletion(submissionId, formId, user);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          eligibleForDeletionAt: expect.any(Date),
        })
      );
    });
  });

  describe('cancelDeletion', () => {
    it('should delete scheduled deletion record', async () => {
      const submissionId = 'sub-123';

      const mockDelete = jest.fn().mockResolvedValue(1);
      ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          delete: mockDelete,
        }),
      });

      const result = await localService.cancelDeletion(submissionId);

      expect(result).toEqual({ submissionId, cancelled: true });
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return cancelled false if no record found', async () => {
      const submissionId = 'sub-999';

      const mockDelete = jest.fn().mockResolvedValue(0);
      ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          delete: mockDelete,
        }),
      });

      const result = await localService.cancelDeletion(submissionId);

      expect(result).toEqual({ submissionId, cancelled: false });
    });
  });

  describe('processDeletions', () => {
    it('should process eligible deletions', async () => {
      const mockScheduled = [
        {
          id: 'sched-1',
          submissionId: 'sub-1',
          status: 'pending',
        },
      ];

      const mockLimit = jest.fn().mockResolvedValue(mockScheduled);
      const mockWhere2 = jest.fn().mockReturnValue({
        limit: mockLimit,
      });
      const mockWhere1 = jest.fn().mockReturnValue({
        where: mockWhere2,
      });

      ScheduledSubmissionDeletion.query = jest
        .fn()
        .mockReturnValueOnce({
          where: mockWhere1,
        })
        .mockReturnValue({
          patchAndFetchById: jest.fn().mockResolvedValue({ status: 'completed' }),
        });

      submissionService.deleteSubmissionAndRelatedData = jest.fn().mockResolvedValue(true);

      const result = await localService.processDeletions(100);

      expect(result.processed).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should return empty results if no eligible deletions', async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockWhere2 = jest.fn().mockReturnValue({
        limit: mockLimit,
      });
      const mockWhere1 = jest.fn().mockReturnValue({
        where: mockWhere2,
      });

      ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
        where: mockWhere1,
      });

      const result = await localService.processDeletions(100);

      expect(result).toEqual({ processed: 0, results: [] });
    });
  });

  describe('hardDeleteSubmissions', () => {
    it('should hard delete multiple submissions', async () => {
      const submissionIds = ['sub-1', 'sub-2'];

      submissionService.deleteSubmissionAndRelatedData = jest.fn().mockResolvedValue(true);

      const mockUpdate = jest.fn().mockResolvedValue(1);
      ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      const result = await localService.hardDeleteSubmissions(submissionIds);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.status === 'completed')).toBe(true);
      expect(submissionService.deleteSubmissionAndRelatedData).toHaveBeenCalledTimes(2);
    });

    it('should handle deletion failures', async () => {
      const submissionIds = ['sub-1', 'sub-error'];

      submissionService.deleteSubmissionAndRelatedData = jest.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('Deletion failed'));

      const mockUpdate = jest.fn().mockResolvedValue(1);
      ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      const result = await localService.hardDeleteSubmissions(submissionIds);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('completed');
      expect(result[1].status).toBe('failed');
    });
  });
});
