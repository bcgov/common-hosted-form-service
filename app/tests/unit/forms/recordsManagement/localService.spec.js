const localService = require('../../../../src/forms/recordsManagement/localService');
const { RetentionPolicy, ScheduledSubmissionDeletion, SubmissionMetadata } = require('../../../../src/forms/common/models');
const submissionService = require('../../../../src/forms/submission/service');

const testUuid = '123';
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue(testUuid),
}));
jest.mock('../../../../src/forms/common/models');
jest.mock('../../../../src/forms/submission/service');

// Helper functions to reduce nesting depth
const createRetentionPolicyQueryMock = (mockPolicy) => {
  const mockThrowIfNotFound = jest.fn().mockResolvedValue(mockPolicy);
  const mockWithGraphFetched = jest.fn().mockReturnValue({
    throwIfNotFound: mockThrowIfNotFound,
  });
  const mockFindOne = jest.fn().mockReturnValue({
    withGraphFetched: mockWithGraphFetched,
  });
  return {
    findOne: mockFindOne,
  };
};

const createRetentionPolicyQueryMockWithError = (error) => {
  const mockThrowIfNotFound = jest.fn().mockRejectedValue(error);
  const mockWithGraphFetched = jest.fn().mockReturnValue({
    throwIfNotFound: mockThrowIfNotFound,
  });
  const mockFindOne = jest.fn().mockReturnValue({
    withGraphFetched: mockWithGraphFetched,
  });
  return {
    findOne: mockFindOne,
  };
};

const createScheduledDeletionWhereDeleteMock = (mockDelete) => {
  const mockWhere = jest.fn().mockReturnValue({
    delete: mockDelete,
  });
  return {
    where: mockWhere,
  };
};

const createScheduledDeletionWhereUpdateMock = (mockUpdate) => {
  const mockWhere = jest.fn().mockReturnValue({
    update: mockUpdate,
  });
  return {
    where: mockWhere,
  };
};

describe('localService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (submissionService.deleteSubmissionAndRelatedData) {
      submissionService.deleteSubmissionAndRelatedData.mockReset?.();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getRetentionPolicy should return retention policy with classification', async () => {
    const formId = 'form-123';
    const mockPolicy = {
      formId,
      retentionDays: 365,
      retentionClassificationDescription: 'test',
      retentionClassificationId: '123123',
    };

    RetentionPolicy.query = jest.fn().mockReturnValue(createRetentionPolicyQueryMock(mockPolicy));

    const result = await localService.getRetentionPolicy(formId);

    expect(result).toEqual(mockPolicy);
    expect(RetentionPolicy.query).toHaveBeenCalled();
  });

  it('getRetentionPolicy should throw error if no policy found', async () => {
    const formId = 'form-456';
    const error = new Error(`No retention policy found for form ${formId}`);
    RetentionPolicy.query = jest.fn().mockReturnValue(createRetentionPolicyQueryMockWithError(error));

    await expect(localService.getRetentionPolicy(formId)).rejects.toThrow(`No retention policy found for form ${formId}`);
  });

  it('configureRetentionPolicy should create new retention policy if not exists, no backfill for no existing submissions', async () => {
    const formId = 'form-123';
    const policyData = { retentionDays: 365, retentionClassificationId: 'class-123', retentionClassificationDescription: 'lorem ipsum' };
    const user = 'testuser';

    const trx = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    };

    RetentionPolicy.startTransaction = jest.fn().mockResolvedValue(trx);

    const mockInsert = jest.fn().mockResolvedValue({ ...policyData, formId, createdBy: user });

    RetentionPolicy.query = jest
      .fn()
      .mockReturnValueOnce({
        findOne: jest.fn().mockResolvedValue(null),
      })
      .mockReturnValueOnce({
        insert: mockInsert,
      });

    SubmissionMetadata.query = jest.fn().mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        whereNotIn: jest.fn().mockResolvedValue([]),
      }),
    });

    ScheduledSubmissionDeletion.query = jest.fn().mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
      }),
    });

    const result = await localService.configureRetentionPolicy(formId, policyData, user);

    expect(result).toEqual({ ...policyData, formId, createdBy: user });
    expect(mockInsert).toHaveBeenCalledWith({
      id: testUuid,
      formId,
      retentionDays: policyData.retentionDays,
      retentionClassificationId: policyData.retentionClassificationId,
      retentionClassificationDescription: policyData.retentionClassificationDescription,
      enabled: true,
      createdBy: user,
    });
  });

  it('configureRetentionPolicy should create new retention policy if not exists, backfill for existing deleted submissions', async () => {
    const formId = 'form-123';
    const policyData = { retentionDays: 365, retentionClassificationId: 'class-123', retentionClassificationDescription: 'lorem ipsum' };
    const user = 'testuser';

    const trx = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    };

    RetentionPolicy.startTransaction = jest.fn().mockResolvedValue(trx);

    const mockInsert = jest.fn().mockResolvedValue({ ...policyData, formId, createdBy: user });

    RetentionPolicy.query = jest
      .fn()
      .mockReturnValueOnce({
        findOne: jest.fn().mockResolvedValue(null),
      })
      .mockReturnValueOnce({
        insert: mockInsert,
      });

    SubmissionMetadata.query = jest.fn().mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        whereNotIn: jest.fn().mockResolvedValue([
          {
            submissionId: '123',
            deleted: true,
          },
        ]),
      }),
    });

    ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereNotIn: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({}),
    });

    const result = await localService.configureRetentionPolicy(formId, policyData, user);

    expect(result).toEqual({ ...policyData, formId, createdBy: user });
    expect(mockInsert).toHaveBeenCalledWith({
      id: testUuid,
      formId,
      retentionDays: policyData.retentionDays,
      retentionClassificationId: policyData.retentionClassificationId,
      retentionClassificationDescription: policyData.retentionClassificationDescription,
      enabled: true,
      createdBy: user,
    });
  });

  it('configureRetentionPolicy should update existing retention policy, recalculates scheduled deletions if retention policy is enabled', async () => {
    const formId = 'form-123';
    const policyData = { retentionDays: 730, retentionClassificationId: 'class-456' };
    const user = 'testuser';
    const existingPolicy = { id: 'policy-123', formId };

    const mockPatchAndFetchById = jest.fn().mockResolvedValue({
      id: 'policy-123',
      ...policyData,
      updatedBy: user,
    });

    RetentionPolicy.query = jest
      .fn()
      .mockReturnValueOnce({
        findOne: jest.fn().mockResolvedValue(existingPolicy),
      })
      .mockReturnValueOnce({
        patchAndFetchById: mockPatchAndFetchById,
      });

    ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      whereNotIn: jest.fn().mockReturnThis(),
      patch: jest.fn().mockResolvedValue(),
      delete: jest.fn().mockResolvedValue(),
    });

    const result = await localService.configureRetentionPolicy(formId, policyData, user);

    expect(result).toEqual({
      id: 'policy-123',
      ...policyData,
      updatedBy: user,
    });
    expect(mockPatchAndFetchById).toHaveBeenCalledWith('policy-123', {
      enabled: true,
      retentionDays: policyData.retentionDays,
      retentionClassificationId: policyData.retentionClassificationId,
      retentionClassificationDescription: undefined,
      updatedBy: user,
      updatedAt: expect.any(String),
    });
  });

  it('configureRetentionPolicy should update existing retention policy, deletes scheduled deletions if retention policy is disabled', async () => {
    const formId = 'form-123';
    const policyData = { retentionDays: 730, retentionClassificationId: 'class-456', enabled: false };
    const user = 'testuser';
    const existingPolicy = { id: 'policy-123', formId };

    const mockPatchAndFetchById = jest.fn().mockResolvedValue({
      id: 'policy-123',
      ...policyData,
      updatedBy: user,
    });

    RetentionPolicy.query = jest
      .fn()
      .mockReturnValueOnce({
        findOne: jest.fn().mockResolvedValue(existingPolicy),
      })
      .mockReturnValueOnce({
        patchAndFetchById: mockPatchAndFetchById,
      });

    ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      whereNotIn: jest.fn().mockReturnThis(),
      patch: jest.fn().mockResolvedValue(),
      delete: jest.fn().mockResolvedValue(),
    });

    const result = await localService.configureRetentionPolicy(formId, policyData, user);

    expect(result).toEqual({
      id: 'policy-123',
      ...policyData,
      updatedBy: user,
    });
    expect(mockPatchAndFetchById).toHaveBeenCalledWith('policy-123', {
      enabled: false,
      retentionDays: policyData.retentionDays,
      retentionClassificationId: policyData.retentionClassificationId,
      retentionClassificationDescription: undefined,
      updatedBy: user,
      updatedAt: expect.any(String),
    });
  });

  it('scheduleDeletion should schedule deletion with calculated eligibleForDeletionAt', async () => {
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

  it('scheduleDeletion should handle indefinite retention (null retentionDays)', async () => {
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
      eligibleForDeletionAt: expect.any(String),
      status: 'pending',
    });

    ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    await localService.scheduleDeletion(submissionId, formId, user);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        eligibleForDeletionAt: expect.any(String),
      })
    );
  });

  it('cancelDeletion should delete scheduled deletion record', async () => {
    const submissionId = 'sub-123';

    const mockDelete = jest.fn().mockResolvedValue(1);
    ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue(createScheduledDeletionWhereDeleteMock(mockDelete));

    const result = await localService.cancelDeletion(submissionId);

    expect(result).toEqual({ submissionId, cancelled: true });
    expect(mockDelete).toHaveBeenCalled();
  });

  it('cancelDeletion should return cancelled false if no record found', async () => {
    const submissionId = 'sub-999';

    const mockDelete = jest.fn().mockResolvedValue(0);
    ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue(createScheduledDeletionWhereDeleteMock(mockDelete));

    const result = await localService.cancelDeletion(submissionId);

    expect(result).toEqual({ submissionId, cancelled: false });
  });

  it('processDeletions should process eligible deletions', async () => {
    const mockEligible = [
      { id: 'sched-1', submissionId: 'sub-1' },
      { id: 'sched-2', submissionId: 'sub-2' },
    ];

    const mockQueryBuilder = {
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockEligible),
      patchAndFetchById: jest.fn().mockResolvedValue({}),
    };

    ScheduledSubmissionDeletion.query = jest.fn(() => mockQueryBuilder);

    submissionService.deleteSubmissionAndRelatedData = jest.fn().mockResolvedValue();

    const result = await localService.processDeletions(100);

    expect(result.processed).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.results)).toBe(true);
  });

  it('processDeletions should return empty results if no eligible deletions', async () => {
    const mockEligible = [];

    const mockQueryBuilder = {
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockEligible),
      patchAndFetchById: jest.fn().mockResolvedValue({}),
    };

    ScheduledSubmissionDeletion.query = jest.fn(() => mockQueryBuilder);

    submissionService.deleteSubmissionAndRelatedData = jest.fn().mockResolvedValue();

    const result = await localService.processDeletions(100);

    expect(result).toEqual({ processed: 0, results: [] });
  });

  describe('hardDeleteSubmissions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      submissionService.deleteSubmissionAndRelatedData = jest.fn();
      ScheduledSubmissionDeletion.query = jest.fn();
    });

    it('should hard delete multiple submissions', async () => {
      const submissionIds = ['sub-1', 'sub-2'];

      submissionService.deleteSubmissionAndRelatedData.mockResolvedValue(true);

      const mockUpdate = jest.fn().mockResolvedValue(1);
      ScheduledSubmissionDeletion.query.mockReturnValue(createScheduledDeletionWhereUpdateMock(mockUpdate));

      const result = await localService.hardDeleteSubmissions(submissionIds);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.status === 'completed')).toBe(true);
      expect(submissionService.deleteSubmissionAndRelatedData).toHaveBeenCalledTimes(2);
    });

    it('should handle deletion failures', async () => {
      const submissionIds = ['sub-1', 'sub-error'];

      submissionService.deleteSubmissionAndRelatedData = jest.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('Deletion failed'));

      const mockUpdate = jest.fn().mockResolvedValue(1);
      ScheduledSubmissionDeletion.query = jest.fn().mockReturnValue(createScheduledDeletionWhereUpdateMock(mockUpdate));

      const result = await localService.hardDeleteSubmissions(submissionIds);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('completed');
      expect(result[1].status).toBe('failed');
    });
  });
});
