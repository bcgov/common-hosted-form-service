const apiAccess = require('../../../../../src/forms/auth/middleware/apiAccess');

const formService = require('../../../../../src/forms/form/service');
const submissionService = require('../../../../../src/forms/submission/service');
const fileService = require('../../../../../src/forms/file/service');

describe('apiAccess', () => {
  const formId = 'c6455376-382c-439d-a811-0381a012d696';
  const formSubmissionId = '3ba5659c-1a3f-4e76-a0d4-ef00f5102387';
  const secret = 'dd7d1699-61ec-4037-aa33-727f8aa79c0a';
  const token = Buffer.from(`${formId}:${secret}`).toString('base64');
  const authHeader = `Basic ${token}`;

  const baseRes = { status: () => ({ json: () => {} }) };

  const next = jest.fn();
  const mockReadApiKey = jest.spyOn(formService, 'readApiKey');

  beforeEach(() => {
    next.mockReset();
    mockReadApiKey.mockReset();
  });

  afterAll(() => {
    mockReadApiKey.mockRestore();
  });

  it('should only call next if there are no headers', async () => {
    const req = {};
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockReadApiKey).toHaveBeenCalledTimes(0);
  });

  it('should only call next if there are no auth headers', async () => {
    const req = { headers: {} };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockReadApiKey).toHaveBeenCalledTimes(0);
  });

  it('should only call next with bearer authorization', async () => {
    const req = { headers: { authorization: 'Bearer JWT' } };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockReadApiKey).toHaveBeenCalledTimes(0);
  });

  it('should not call readApiKey with no formId or formSubmissionId param', async () => {
    const req = { headers: { authorization: authHeader } };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(0);
  });

  it('should not call readApiKey with invalid formId param', async () => {
    const req = {
      headers: { authorization: authHeader },
      params: { formId: 'invalidForm' },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(0);
  });

  it('should not call readApiKey with invalid formSubmissionId param', async () => {
    const req = {
      headers: { authorization: authHeader },
      params: { formSubmissionId: 'invalidForm' },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(0);
  });

  it('should flag apiUser as false with no API key result', async () => {
    mockReadApiKey.mockResolvedValue();
    const req = {
      headers: { authorization: authHeader },
      params: { formId: formId },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(1);
  });

  it('should flag apiUser as false with no API key secret', async () => {
    mockReadApiKey.mockResolvedValue({});
    const req = {
      headers: { authorization: authHeader },
      params: { formId: formId },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(1);
  });

  it('should flag apiUser as false with invalid formId credentials', async () => {
    mockReadApiKey.mockResolvedValue({ secret: 'invalidSecret' });
    const req = {
      headers: { authorization: authHeader },
      params: { formId: formId },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(1);
  });

  it('should flag apiUser as false with invalid formSubmissionId credentials', async () => {
    mockReadApiKey.mockResolvedValue({ secret: 'invalidSecret' });
    submissionService.read = jest.fn().mockReturnValue({ form: { id: formId } });

    const req = {
      headers: { authorization: authHeader },
      params: { formSubmissionId: formSubmissionId },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(1);
  });

  it('should flag apiUser as false with no submission result', async () => {
    mockReadApiKey.mockResolvedValue({ secret: 'invalidSecret' });
    submissionService.read = jest.fn().mockReturnValue();

    const req = {
      headers: { authorization: authHeader },
      params: { formSubmissionId: formSubmissionId },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(0);
  });

  it('should flag apiUser as false with submission result without form', async () => {
    mockReadApiKey.mockResolvedValue({ secret: 'invalidSecret' });
    submissionService.read = jest.fn().mockReturnValue({});

    const req = {
      headers: { authorization: authHeader },
      params: { formSubmissionId: formSubmissionId },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(0);
  });

  it('should flag apiUser as false with submission result without form id', async () => {
    mockReadApiKey.mockResolvedValue({ secret: 'invalidSecret' });
    submissionService.read = jest.fn().mockReturnValue({ form: {} });

    const req = {
      headers: { authorization: authHeader },
      params: { formSubmissionId: formSubmissionId },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeFalsy();
    expect(next).toHaveBeenCalledTimes(0);
    expect(mockReadApiKey).toHaveBeenCalledTimes(0);
  });

  it('should flag apiUser as true with valid credentials', async () => {
    mockReadApiKey.mockResolvedValue({ secret: secret });
    const req = {
      headers: { authorization: authHeader },
      params: { formId: formId },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(req.apiUser).toBeTruthy();
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockReadApiKey).toHaveBeenCalledTimes(1);
  });

  it('should process correctly with a valid file id and associated submissionId', async () => {
    fileService.read = jest.fn().mockResolvedValue({ formSubmissionId: formSubmissionId });
    submissionService.read = jest.fn().mockResolvedValue({ form: { id: formId } });
    mockReadApiKey.mockResolvedValue({ secret: secret, filesAPIAccess: true });
    const req = {
      headers: { authorization: authHeader },
      params: { id: 'c6455376-382c-439d-a811-0381a012d696' },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(fileService.read).toHaveBeenCalledWith('c6455376-382c-439d-a811-0381a012d696');
    expect(submissionService.read).toHaveBeenCalledWith(formSubmissionId);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.apiUser).toBeTruthy();
  });

  it('should throw an error if the file id does not have an associated submission id', async () => {
    fileService.read = jest.fn().mockResolvedValue({ formSubmissionId: null });
    mockReadApiKey.mockResolvedValue({ secret: secret });

    const req = {
      headers: { authorization: authHeader },
      params: { id: 'c6455376-382c-439d-a811-0381a012d696' },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(fileService.read).toHaveBeenCalledWith('c6455376-382c-439d-a811-0381a012d696');
    expect(submissionService.read).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new Error('Submission ID not found in file storage.'));
    expect(req.apiUser).toBeUndefined();
  });

  it('should throw an error if filesAPIAccess is false', async () => {
    fileService.read = jest.fn().mockResolvedValue({ formSubmissionId: formSubmissionId });
    submissionService.read = jest.fn().mockResolvedValue({ form: { id: formId } });
    mockReadApiKey.mockResolvedValue({ secret: secret, filesAPIAccess: false });
    const req = {
      headers: { authorization: authHeader },
      params: { id: 'c6455376-382c-439d-a811-0381a012d696' },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new Error('Files API access is not enabled for this form.'));
    expect(req.apiUser).toBeUndefined();
    expect(mockReadApiKey).toHaveBeenCalledTimes(1);
  });

  it('should allow access to the files API if filesAPIAccess is true', async () => {
    mockReadApiKey.mockResolvedValue({ secret: secret, filesAPIAccess: true });
    const req = {
      headers: { authorization: authHeader },
      params: { formId: formId },
    };
    const res = { ...baseRes };
    await apiAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockReadApiKey).toHaveBeenCalledTimes(1);
    expect(req.apiUser).toBeTruthy();
  });
});
