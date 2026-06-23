const uuid = require('uuid');

const submissionService = require('../../../../../../src/forms/submission/service');
const cdogsV3ConfigService = require('../../../../../../src/forms/form/cdogsV3ConfigService');
const requireCdogsV3Access = require('../../../../../../src/v2/forms/submission/middleware/requireCdogsV3Access');

//
// Mock out the services
//

jest.mock('../../../../../../src/forms/submission/service');
jest.mock('../../../../../../src/forms/form/cdogsV3ConfigService');

//
// Test setup
//

describe('requireCdogsV3Access', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
    };
    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Draft template route (formId in body)', () => {
    it('should call next() when CDOGS v3 is enabled for the form', async () => {
      const formId = uuid.v4();
      req.body = { formId };

      cdogsV3ConfigService.hasV3Access.mockResolvedValue(true);

      await requireCdogsV3Access(req, res, next);

      expect(cdogsV3ConfigService.hasV3Access).toHaveBeenCalledWith(formId);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() with 403 error when CDOGS v3 is not enabled for the form', async () => {
      const formId = uuid.v4();
      req.body = { formId };

      cdogsV3ConfigService.hasV3Access.mockResolvedValue(false);

      await requireCdogsV3Access(req, res, next);

      expect(cdogsV3ConfigService.hasV3Access).toHaveBeenCalledWith(formId);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(403);
      expect(error.detail).toBe('CDOGS v3 is not enabled for this form.');
    });
  });

  describe('Submission route (formSubmissionId in params)', () => {
    it('should call next() when CDOGS v3 is enabled for the form', async () => {
      const formId = uuid.v4();
      const formSubmissionId = uuid.v4();
      req.params = { formSubmissionId };

      submissionService.read.mockResolvedValue({
        form: { id: formId },
      });
      cdogsV3ConfigService.hasV3Access.mockResolvedValue(true);

      await requireCdogsV3Access(req, res, next);

      expect(submissionService.read).toHaveBeenCalledWith(formSubmissionId);
      expect(cdogsV3ConfigService.hasV3Access).toHaveBeenCalledWith(formId);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() with 403 error when CDOGS v3 is not enabled for the form', async () => {
      const formId = uuid.v4();
      const formSubmissionId = uuid.v4();
      req.params = { formSubmissionId };

      submissionService.read.mockResolvedValue({
        form: { id: formId },
      });
      cdogsV3ConfigService.hasV3Access.mockResolvedValue(false);

      await requireCdogsV3Access(req, res, next);

      expect(submissionService.read).toHaveBeenCalledWith(formSubmissionId);
      expect(cdogsV3ConfigService.hasV3Access).toHaveBeenCalledWith(formId);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(403);
      expect(error.detail).toBe('CDOGS v3 is not enabled for this form.');
    });
  });

  describe('Error cases', () => {
    it('should call next() with 400 error when formId cannot be determined', async () => {
      // No formId in body and no formSubmissionId in params

      await requireCdogsV3Access(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(400);
      expect(error.detail).toBe('Unable to determine form ID for CDOGS v3 access check.');
    });

    it('should call next() with error when submissionService.read() fails', async () => {
      const formSubmissionId = uuid.v4();
      const testError = new Error('Database error');
      req.params = { formSubmissionId };

      submissionService.read.mockRejectedValue(testError);

      await requireCdogsV3Access(req, res, next);

      expect(submissionService.read).toHaveBeenCalledWith(formSubmissionId);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(testError);
    });

    it('should call next() with error when cdogsV3ConfigService.hasV3Access() fails', async () => {
      const formId = uuid.v4();
      const testError = new Error('Config service error');
      req.body = { formId };

      cdogsV3ConfigService.hasV3Access.mockRejectedValue(testError);

      await requireCdogsV3Access(req, res, next);

      expect(cdogsV3ConfigService.hasV3Access).toHaveBeenCalledWith(formId);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('Priority of formId sources', () => {
    it('should prioritize formId from body over params', async () => {
      const bodyFormId = uuid.v4();
      const formSubmissionId = uuid.v4();
      req.body = { formId: bodyFormId };
      req.params = { formSubmissionId };

      cdogsV3ConfigService.hasV3Access.mockResolvedValue(true);

      await requireCdogsV3Access(req, res, next);

      // Should use bodyFormId and not fetch submission
      expect(submissionService.read).not.toHaveBeenCalled();
      expect(cdogsV3ConfigService.hasV3Access).toHaveBeenCalledWith(bodyFormId);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
