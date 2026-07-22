const service = require('../../../../src/forms/recordsManagement/service');

jest.mock('../../../../src/forms/recordsManagement/service');

describe('recordsManagement controller', () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = require('../../../../src/forms/recordsManagement/controller');
    req = {
      params: {},
      body: {},
      currentUser: { usernameIdp: 'testuser' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('scheduleDeletion', () => {
    it('should schedule deletion and return result', async () => {
      req.params = { formSubmissionId: 'sub-123' };
      req.body = { formId: 'form-123' };
      const mockResult = { formSubmissionId: 'sub-123', status: 'pending' };

      service.scheduleDeletion = jest.fn().mockResolvedValue(mockResult);

      await controller.scheduleDeletion(req, res, next);

      expect(service.scheduleDeletion).toHaveBeenCalledWith('sub-123', 'form-123', 'testuser');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 204 when no retention policy exists', async () => {
      req.params = { formSubmissionId: 'sub-123' };
      req.body = { formId: 'form-123' };
      const error = new Error('No matching row found');
      error.name = 'NotFoundError';

      service.scheduleDeletion = jest.fn().mockRejectedValue(error);

      await controller.scheduleDeletion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params = { formSubmissionId: 'sub-123' };
      const error = new Error('Service error');

      service.scheduleDeletion = jest.fn().mockRejectedValue(error);

      await controller.scheduleDeletion(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelDeletion', () => {
    it('should cancel deletion and return result', async () => {
      req.params = { formSubmissionId: 'sub-123' };
      const mockResult = { formSubmissionId: 'sub-123', cancelled: true };

      service.cancelDeletion = jest.fn().mockResolvedValue(mockResult);

      await controller.cancelDeletion(req, res, next);

      expect(service.cancelDeletion).toHaveBeenCalledWith('sub-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 204 when no retention policy exists', async () => {
      req.params = { formSubmissionId: 'sub-123' };
      const error = new Error('No matching row found');
      error.name = 'NotFoundError';

      service.cancelDeletion = jest.fn().mockRejectedValue(error);

      await controller.cancelDeletion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params = { formSubmissionId: 'sub-123' };
      const error = new Error('Service error');

      service.cancelDeletion = jest.fn().mockRejectedValue(error);

      await controller.cancelDeletion(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPolicy', () => {
    it('should return retention policy', async () => {
      req.params = { formId: 'form-123' };
      const mockPolicy = { formId: 'form-123', retentionDays: 365 };

      service.getRetentionPolicy = jest.fn().mockResolvedValue(mockPolicy);

      await controller.getPolicy(req, res, next);

      expect(service.getRetentionPolicy).toHaveBeenCalledWith('form-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPolicy);
    });
  });

  describe('setPolicy', () => {
    it('should configure retention policy', async () => {
      req.params = { formId: 'form-123' };
      req.body = { retentionDays: 730, retentionClassificationId: 'class-123' };
      const mockResult = { formId: 'form-123', retentionDays: 730 };

      service.configureRetentionPolicy = jest.fn().mockResolvedValue(mockResult);

      await controller.setPolicy(req, res, next);

      expect(service.configureRetentionPolicy).toHaveBeenCalledWith('form-123', req.body, 'testuser');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('processDeletions', () => {
    it('should process deletions with default batch size', async () => {
      req.body = {};
      const mockResult = { processed: 5, results: [] };

      service.processDeletions = jest.fn().mockResolvedValue(mockResult);

      await controller.processDeletions(req, res, next);

      expect(service.processDeletions).toHaveBeenCalledWith(100);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should process deletions with custom batch size', async () => {
      req.body = { batchSize: 50 };
      const mockResult = { processed: 5, results: [] };

      service.processDeletions = jest.fn().mockResolvedValue(mockResult);

      await controller.processDeletions(req, res, next);

      expect(service.processDeletions).toHaveBeenCalledWith(50);
    });
  });

  describe('processDeletionsWebhook', () => {
    it('should hard delete submissions from webhook', async () => {
      req.body = { submissionIds: ['sub-1', 'sub-2'] };
      const mockResults = [
        { formSubmissionId: 'sub-1', status: 'completed' },
        { formSubmissionId: 'sub-2', status: 'completed' },
      ];

      service.hardDeleteSubmissions = jest.fn().mockResolvedValue(mockResults);

      await controller.processDeletionsWebhook(req, res, next);

      expect(service.hardDeleteSubmissions).toHaveBeenCalledWith(['sub-1', 'sub-2']);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ results: mockResults });
    });

    it('should reject non-array submissionIds', async () => {
      req.body = { submissionIds: 'not-an-array' };

      await controller.processDeletionsWebhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'submissionIds must be an array' });
    });
  });
});
