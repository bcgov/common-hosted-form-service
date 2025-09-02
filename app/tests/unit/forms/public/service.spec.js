const service = require('../../../../src/forms/public/service');
const reminderService = require('../../../../src/forms/email/reminderService');
const deletionService = require('../../../../src/forms/submission/deletionService');

// Mock the dependent services
jest.mock('../../../../src/forms/email/reminderService');
jest.mock('../../../../src/forms/submission/deletionService');

describe('public/service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendReminderToSubmitter', () => {
    it('should call reminderService._init and return its result', async () => {
      // Mock the reminderService response
      const mockResponse = { remindersSent: 5, message: 'Reminders sent successfully' };
      reminderService._init.mockResolvedValue(mockResponse);

      // Call the service function
      const result = await service.sendReminderToSubmitter();

      // Verify results
      expect(reminderService._init).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate any errors from reminderService', async () => {
      // Mock an error
      const error = new Error('Failed to send reminders');
      reminderService._init.mockRejectedValue(error);

      // Call and verify the service function throws the error
      await expect(service.sendReminderToSubmitter()).rejects.toThrow(error);
      expect(reminderService._init).toHaveBeenCalledTimes(1);
    });
  });

  describe('processHardDeletions', () => {
    it('should call deletionService.processHardDeletions and return its result', async () => {
      // Mock the deletionService response
      const mockResponse = {
        message: 'Submission deletion process completed',
        deletedCount: 5,
      };
      deletionService.processHardDeletions.mockResolvedValue(mockResponse);

      // Call the service function
      const result = await service.processHardDeletions();

      // Verify results
      expect(deletionService.processHardDeletions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle the case when no submissions are found for deletion', async () => {
      // Mock a response with no deletions
      const mockResponse = {
        message: 'No eligible submissions found for deletion',
        deletedCount: 0,
      };
      deletionService.processHardDeletions.mockResolvedValue(mockResponse);

      // Call the service function
      const result = await service.processHardDeletions();

      // Verify results
      expect(deletionService.processHardDeletions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
      expect(result.deletedCount).toBe(0);
    });

    it('should propagate any errors from deletionService', async () => {
      // Mock an error
      const error = new Error('Database connection error');
      deletionService.processHardDeletions.mockRejectedValue(error);

      // Call and verify the service function throws the error
      await expect(service.processHardDeletions()).rejects.toThrow(error);
      expect(deletionService.processHardDeletions).toHaveBeenCalledTimes(1);
    });
  });
});
