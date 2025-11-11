const controller = require('../../../../src/forms/public/controller');
const service = require('../../../../src/forms/public/service');

// Mock the service module
jest.mock('../../../../src/forms/public/service');

describe('public/controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('sendReminderToSubmitter', () => {
    it('should return 200 with service response on success', async () => {
      // Mock service response
      const mockResponse = { message: 'Reminder sent successfully' };
      service.sendReminderToSubmitter.mockResolvedValue(mockResponse);

      // Call the controller function
      await controller.sendReminderToSubmitter(req, res, next);

      // Verify the results
      expect(service.sendReminderToSubmitter).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws an error', async () => {
      // Mock service error
      const error = new Error('Failed to send reminder');
      service.sendReminderToSubmitter.mockRejectedValue(error);

      // Call the controller function
      await controller.sendReminderToSubmitter(req, res, next);

      // Verify the results
      expect(service.sendReminderToSubmitter).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('processHardDeletions', () => {
    it('should return 200 with service response on success', async () => {
      // Mock service response
      const mockResponse = {
        message: 'Submission deletion process completed',
        deletedCount: 5,
      };
      service.processHardDeletions.mockResolvedValue(mockResponse);

      // Call the controller function
      await controller.processHardDeletions(req, res, next);

      // Verify the results
      expect(service.processHardDeletions).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws an error', async () => {
      // Mock service error
      const error = new Error('Database connection error');
      service.processHardDeletions.mockRejectedValue(error);

      // Call the controller function
      await controller.processHardDeletions(req, res, next);

      // Verify the results
      expect(service.processHardDeletions).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle case when no submissions are found for deletion', async () => {
      // Mock service response for no submissions
      const mockResponse = {
        message: 'No eligible submissions found for deletion',
        deletedCount: 0,
      };
      service.processHardDeletions.mockResolvedValue(mockResponse);

      // Call the controller function
      await controller.processHardDeletions(req, res, next);

      // Verify the results
      expect(service.processHardDeletions).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
