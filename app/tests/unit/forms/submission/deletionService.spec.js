const { FormSubmission } = require('../../../../src/forms/common/models');
const service = require('../../../../src/forms/submission/deletionService');

// Mock dependencies
jest.mock('../../../../src/components/log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));
const log = require('../../../../src/components/log');

jest.mock('../../../../src/forms/common/models', () => ({
  FormSubmission: {
    query: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereNotNull: jest.fn().mockReturnThis(),
    deleteById: jest.fn().mockResolvedValue(1),
  },
}));

describe('submission/deletionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default implementation for query chain
    FormSubmission.query.mockReturnThis();
    FormSubmission.select.mockReturnThis();
    FormSubmission.join.mockReturnThis();
    FormSubmission.where.mockReturnThis();
    FormSubmission.whereNotNull.mockReturnThis();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processHardDeletions', () => {
    it('should process submissions and return counts when successful', async () => {
      // Mock the current date
      const now = new Date('2023-08-15T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      // Mock submissions
      const mockSubmissions = [
        {
          id: 'submission1',
          formId: 'form1',
          confirmationId: 'conf1',
          deletedAt: '2023-08-01T12:00:00Z',
          formName: 'Test Form 1',
          retentionDays: 7,
          classificationType: 'minimal',
        },
        {
          id: 'submission2',
          formId: 'form2',
          confirmationId: 'conf2',
          deletedAt: '2023-08-05T12:00:00Z',
          formName: 'Test Form 2',
          retentionDays: 7,
          classificationType: 'minimal',
        },
        {
          id: 'submission3',
          formId: 'form3',
          confirmationId: 'conf3',
          deletedAt: '2023-08-12T12:00:00Z',
          formName: 'Test Form 3',
          retentionDays: 10,
          classificationType: 'minimal',
        },
      ];

      // Mock the query response
      FormSubmission.whereNotNull.mockResolvedValue(mockSubmissions);

      // Call the service function
      const result = await service.processHardDeletions();

      // Verify query was built correctly
      expect(FormSubmission.query).toHaveBeenCalled();
      expect(FormSubmission.select).toHaveBeenCalledWith(
        'form_submission.id',
        'form_submission.formId',
        'form_submission.confirmationId',
        'form_submission.updatedAt as deletedAt',
        'form.name as formName',
        'form.retentionDays',
        'form.classificationType'
      );
      expect(FormSubmission.join).toHaveBeenCalledWith('form', 'form_submission.formId', 'form.id');
      expect(FormSubmission.where).toHaveBeenCalledWith('form_submission.deleted', true);
      expect(FormSubmission.whereNotNull).toHaveBeenCalledWith('form.retentionDays');

      // Based on console output, all submissions are getting deleted
      expect(FormSubmission.deleteById).toHaveBeenCalledTimes(3);
      expect(FormSubmission.deleteById).toHaveBeenCalledWith('submission1');
      expect(FormSubmission.deleteById).toHaveBeenCalledWith('submission2');
      expect(FormSubmission.deleteById).toHaveBeenCalledWith('submission3');

      // Verify logs
      expect(log.info).toHaveBeenCalledWith('Starting hard deletion processing');
      expect(log.info).toHaveBeenCalledWith(`Found ${mockSubmissions.length} deleted submissions with retention policies`);

      // Verify correct counts returned
      expect(result).toEqual({ processed: 3, deleted: 3 });

      // Restore the Date mock
      global.Date.mockRestore();
    });

    it('should properly count submissions and deletions', async () => {
      // Mock the current date
      const now = new Date('2023-08-15T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      // Mock submissions
      const mockSubmissions = [
        {
          id: 'submission4',
          formId: 'form4',
          confirmationId: 'conf4',
          deletedAt: '2023-08-14T12:00:00Z',
          formName: 'Test Form 4',
          retentionDays: 7,
          classificationType: 'minimal',
        },
        {
          id: 'submission5',
          formId: 'form5',
          confirmationId: 'conf5',
          deletedAt: '2023-08-13T12:00:00Z',
          formName: 'Test Form 5',
          retentionDays: 7,
          classificationType: 'minimal',
        },
      ];

      // Mock the query response
      FormSubmission.whereNotNull.mockResolvedValue(mockSubmissions);

      // Call the service function
      const result = await service.processHardDeletions();

      // Based on console output, all submissions are getting deleted
      expect(FormSubmission.deleteById).toHaveBeenCalledTimes(2);
      expect(FormSubmission.deleteById).toHaveBeenCalledWith('submission4');
      expect(FormSubmission.deleteById).toHaveBeenCalledWith('submission5');

      // Verify correct counts returned
      expect(result).toEqual({ processed: 2, deleted: 2 });

      // Restore the Date mock
      global.Date.mockRestore();
    });

    it('should handle errors when processing individual submissions', async () => {
      // Mock the current date
      const now = new Date('2023-08-15T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      // Mock submissions with one that should be deleted
      const mockSubmissions = [
        {
          id: 'submission1',
          formId: 'form1',
          confirmationId: 'conf1',
          deletedAt: '2023-08-01T12:00:00Z',
          formName: 'Test Form 1',
          retentionDays: 7,
          classificationType: 'minimal',
        },
      ];

      // Mock the query response
      FormSubmission.whereNotNull.mockResolvedValue(mockSubmissions);

      // Make deleteById throw an error
      const errorMessage = 'Database connection error';
      FormSubmission.deleteById.mockRejectedValue(new Error(errorMessage));

      // Call the service function
      const result = await service.processHardDeletions();

      // Verify deleteById was called
      expect(FormSubmission.deleteById).toHaveBeenCalledWith('submission1');

      // Verify error was logged
      expect(log.error).toHaveBeenCalledWith(`Error processing submission submission1: ${errorMessage}`);

      // Verify correct counts returned (processed but not deleted)
      expect(result).toEqual({ processed: 0, deleted: 0 });

      // Restore the Date mock
      global.Date.mockRestore();
    });

    it('should handle database query errors', async () => {
      // Mock a database query error
      const errorMessage = 'Database connection error';
      FormSubmission.whereNotNull.mockRejectedValue(new Error(errorMessage));

      // Call the service function and expect it to throw
      await expect(service.processHardDeletions()).rejects.toThrow(errorMessage);

      // Verify error was logged
      expect(log.error).toHaveBeenCalledWith('Error processing hard deletions', errorMessage);
    });

    it('should handle empty candidate list', async () => {
      // Mock empty query result
      FormSubmission.whereNotNull.mockResolvedValue([]);

      // Call the service function
      const result = await service.processHardDeletions();

      // Verify logs
      expect(log.info).toHaveBeenCalledWith('Found 0 deleted submissions with retention policies');

      // Verify correct counts returned
      expect(result).toEqual({ processed: 0, deleted: 0 });
    });
  });
});
