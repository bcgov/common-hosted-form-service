const apiAccess = require('../../../../../src/forms/auth/middleware/apiAccess');

const formService = require('../../../../../src/forms/form/service');
const submissionService = require('../../../../../src/forms/submission/service');

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
});
