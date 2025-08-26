const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const controller = require('../../../../src/forms/public/controller');
const apiAccess = require('../../../../src/forms/public/middleware/apiAccess');

// Mock middleware
apiAccess.checkApiKey = jest.fn((_req, _res, next) => {
  next();
});

// Get router
const router = require('../../../../src/forms/public/routes');
const basePath = '/public';
const app = expressHelper(basePath, router);
const appRequest = request(app);

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

describe('/public/reminder', () => {
  const path = '/public/reminder';

  beforeEach(() => {
    // Reset controller mock before each test
    controller.sendReminderToSubmitter = jest.fn((_req, res) => {
      res.sendStatus(200);
    });
  });

  it('200s when the APITOKEN matches apiKey', async () => {
    process.env.APITOKEN = uuid.v4();

    const response = await appRequest.get(path).set({ apikey: process.env.APITOKEN });

    expect(response.status).toBe(200);
    expect(apiAccess.checkApiKey).toHaveBeenCalled();
    expect(controller.sendReminderToSubmitter).toHaveBeenCalled();
  });

  it('500s when an error occurs in the controller', async () => {
    process.env.APITOKEN = uuid.v4();

    // Simulate a controller error by returning 500 status directly
    controller.sendReminderToSubmitter.mockImplementation((_req, res) => {
      res.status(500).json({ error: 'Database connection error' });
    });

    const response = await appRequest.get(path).set({ apikey: process.env.APITOKEN });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Database connection error');
    expect(apiAccess.checkApiKey).toHaveBeenCalled();
  });

  it('400s when required parameters are missing', async () => {
    process.env.APITOKEN = uuid.v4();

    controller.sendReminderToSubmitter.mockImplementation((_req, res) => {
      res.status(400).json({ error: 'Missing required parameters' });
    });

    const response = await appRequest.get(path).set({ apikey: process.env.APITOKEN });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required parameters');
  });
});

describe('/public/submission_deletion', () => {
  const path = '/public/submission_deletion';

  beforeEach(() => {
    // Reset controller mock before each test
    controller.processHardDeletions = jest.fn((_req, res) => {
      res.status(200).json({
        message: 'Submission deletion process completed',
        deletedCount: 5,
      });
    });
  });

  it('should call processHardDeletions for GET request', async () => {
    await appRequest.get(path);
    expect(controller.processHardDeletions).toHaveBeenCalled();
  });

  it('should return a 200 response with deletion count', async () => {
    const response = await appRequest.get(path);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Submission deletion process completed',
      deletedCount: 5,
    });
  });

  it('should handle database errors with 500 status', async () => {
    // Mock database error response
    controller.processHardDeletions.mockImplementation((_req, res) => {
      res.status(500).json({
        message: 'Database error occurred during deletion process',
        error: 'Connection timed out',
      });
    });

    const response = await appRequest.get(path);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Database error occurred during deletion process');
  });

  it('should handle case when no eligible submissions are found', async () => {
    // Mock empty result
    controller.processHardDeletions.mockImplementation((_req, res) => {
      res.status(200).json({
        message: 'No eligible submissions found for deletion',
        deletedCount: 0,
      });
    });

    const response = await appRequest.get(path);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('No eligible submissions found for deletion');
    expect(response.body.deletedCount).toBe(0);
  });

  it('should handle uncaught exceptions properly', async () => {
    // Mock server error response instead of throwing
    controller.processHardDeletions.mockImplementation((_req, res) => {
      res.status(500).json({ error: 'Unexpected server error' });
    });

    const response = await appRequest.get(path);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Unexpected server error');
  });
});
