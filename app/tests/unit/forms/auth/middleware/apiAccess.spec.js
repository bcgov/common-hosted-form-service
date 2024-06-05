const { getMockReq, getMockRes } = require('@jest-mock/express');
const { v4: uuidv4 } = require('uuid');

const apiAccess = require('../../../../../src/forms/auth/middleware/apiAccess');
const formService = require('../../../../../src/forms/form/service');
const submissionService = require('../../../../../src/forms/submission/service');
const fileService = require('../../../../../src/forms/file/service');
const { NotFoundError } = require('objection');

describe('apiAccess', () => {
  const fileId = uuidv4();
  const formId = uuidv4();
  const formSubmissionId = uuidv4();
  const secret = uuidv4();

  const token = Buffer.from(`${formId}:${secret}`).toString('base64');
  const authHeader = `Basic ${token}`;

  const mockReadApiKey = jest.spyOn(formService, 'readApiKey');

  beforeEach(() => {
    mockReadApiKey.mockReset();
  });

  afterAll(() => {
    mockReadApiKey.mockRestore();
  });

  // Check that the apiUser parameter is not set when Basic authentication is
  // not being used.
  // Also ensure that we're not calling the DB unless necessary.
  describe('no parameters', () => {
    it('should pass through if there is no auth header', async () => {
      const req = getMockReq({ headers: {} });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    it('should pass through with bearer authorization', async () => {
      const req = getMockReq({ headers: { authorization: 'Bearer JWT' } });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    it('should be unauthorized with no uuid in the params', async () => {
      const req = getMockReq({ headers: { authorization: authHeader } });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
    });
  });

  describe('form id', () => {
    it('should be bad request with non-uuid form id', async () => {
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formId: 'invalidFormId' },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 400 }));
    });

    it('should be unauthorized when db api key result is missing', async () => {
      mockReadApiKey.mockResolvedValue();
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formId: formId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(1);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('should be unauthorized when db api key result is empty', async () => {
      mockReadApiKey.mockResolvedValue({});
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formId: formId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(1);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('should be unauthorized when db api key does not match', async () => {
      mockReadApiKey.mockResolvedValue({ secret: 'invalidSecret' });
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formId: formId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(401);
      expect(next).toBeCalledTimes(0);
    });

    it('should flag apiUser as true with valid form id and credentials', async () => {
      mockReadApiKey.mockResolvedValue({ secret: secret });
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formId: formId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeTruthy();
      expect(mockReadApiKey).toBeCalledTimes(1);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });

  describe('form submission id', () => {
    it('should be bad request with non-uuid form submission id', async () => {
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formSubmissionId: 'invalidFormSubmissionId' },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 400 }));
    });

    it('should pass exceptions through when form submission does not exist', async () => {
      submissionService.read = jest.fn().mockRejectedValue(new NotFoundError());
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formSubmissionId: formSubmissionId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.any(Error));
    });

    it('should be unauthorized when form submission is empty', async () => {
      submissionService.read = jest.fn().mockReturnValue({});
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formSubmissionId: formSubmissionId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('should be unauthorized when form submission has no form id', async () => {
      submissionService.read = jest.fn().mockReturnValue({ form: {} });
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formSubmissionId: formSubmissionId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('should be unauthorized when db api key does not match', async () => {
      mockReadApiKey.mockResolvedValue({ secret: 'invalidSecret' });
      submissionService.read = jest.fn().mockReturnValue({ form: { id: formId } });
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formSubmissionId: formSubmissionId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(401);
      expect(next).toBeCalledTimes(0);
    });

    it('should flag apiUser as true with valid form submission id and credentials', async () => {
      mockReadApiKey.mockResolvedValue({ secret: secret });
      submissionService.read = jest.fn().mockReturnValue({ form: { id: formId } });
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { formSubmissionId: formSubmissionId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeTruthy();
      expect(mockReadApiKey).toBeCalledTimes(1);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });

  describe('file id', () => {
    it('should be bad request with non-uuid file id', async () => {
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { id: 'invalidFileId' },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 400 }));
    });

    it('should pass exceptions through when file does not exist', async () => {
      fileService.read = jest.fn().mockRejectedValue(new NotFoundError());
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { id: fileId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.any(Error));
    });

    it('should be unauthorized when file is empty', async () => {
      fileService.read = jest.fn().mockReturnValue({});
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { id: fileId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 500 }));
    });

    it('should be unauthorized when file has no form submission id', async () => {
      fileService.read = jest.fn().mockReturnValue({ formSubmissionId: undefined });
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { id: fileId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 500 }));
    });

    it('should be unauthorized when form submission does not exist', async () => {
      fileService.read = jest.fn().mockReturnValue({ formSubmissionId: formSubmissionId });
      submissionService.read = jest.fn().mockReturnValue();
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { id: fileId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('should be unauthorized when form submission is empty', async () => {
      fileService.read = jest.fn().mockReturnValue({ formSubmissionId: formSubmissionId });
      submissionService.read = jest.fn().mockReturnValue({});
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { id: fileId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('should be unauthorized when form submission has no form id', async () => {
      fileService.read = jest.fn().mockReturnValue({ formSubmissionId: formSubmissionId });
      submissionService.read = jest.fn().mockReturnValue({ form: {} });
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { id: fileId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(0);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('should be unauthorized when db api key does not match', async () => {
      mockReadApiKey.mockResolvedValue({ secret: 'invalidSecret' });
      fileService.read = jest.fn().mockReturnValue({ formSubmissionId: formSubmissionId });
      submissionService.read = jest.fn().mockReturnValue({ form: { id: formId } });
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { id: fileId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeFalsy();
      expect(mockReadApiKey).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(401);
      expect(next).toBeCalledTimes(0);
    });

    it('should flag apiUser as true with valid file id and credentials', async () => {
      mockReadApiKey.mockResolvedValue({ secret: secret });
      fileService.read = jest.fn().mockReturnValue({ formSubmissionId: formSubmissionId });
      submissionService.read = jest.fn().mockReturnValue({ form: { id: formId } });
      const req = getMockReq({
        headers: { authorization: authHeader },
        params: { id: fileId },
      });
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(req.apiUser).toBeTruthy();
      expect(mockReadApiKey).toBeCalledTimes(1);
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    it('should be forbidden if filesApiAccess is false', async () => {
      mockReadApiKey.mockResolvedValue({ secret: secret, filesApiAccess: false });
      fileService.read = jest.fn().mockResolvedValue({ formSubmissionId: formSubmissionId });
      submissionService.read = jest.fn().mockResolvedValue({ form: { id: formId } });
      const req = {
        headers: { authorization: authHeader },
        params: { id: fileId },
      };
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 403 }));
      expect(res.status).not.toBeCalled();
      expect(req.apiUser).toBeUndefined();
      expect(mockReadApiKey).toBeCalledTimes(1);
    });

    it('should allow access to files if filesAPIAccess is true', async () => {
      mockReadApiKey.mockResolvedValue({ secret: secret, filesAPIAccess: true });
      const req = {
        headers: { authorization: authHeader },
        params: { formId: formId },
      };
      const { res, next } = getMockRes();

      await apiAccess(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(mockReadApiKey).toBeCalledTimes(1);
      expect(req.apiUser).toBeTruthy();
    });
  });
});
