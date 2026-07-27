const Problem = require('api-problem');

const cdogsService = require('../../../src/components/cdogsService');
jest.mock('../../../src/components/cdogsService', () => ({
  templateUploadAndRender: jest.fn(),
}));

const cdogsV3Service = require('../../../src/components/cdogsV3Service');
jest.mock('../../../src/components/cdogsV3Service', () => ({
  templateUploadAndRender: jest.fn(),
}));

const featureService = require('../../../src/forms/feature/service');
jest.mock('../../../src/forms/feature/service', () => ({
  resolve: jest.fn(),
}));

const mockInsert = jest.fn().mockResolvedValue({});
jest.mock('../../../src/forms/common/models', () => ({
  FormDocumentGeneration: {
    query: jest.fn(() => ({ insert: mockInsert })),
  },
}));

const docGenService = require('../../../src/components/docGenService');

const FORM_ID = '00000000-0000-4000-8000-000000000000';
const SUBMISSION_ID = '11111111-1111-4111-8111-111111111111';
const TENANT_ID = '22222222-2222-4222-8222-222222222222';
const RESULT = { data: Buffer.from('pdf'), headers: {}, status: 200 };

// resolve() returns { active } as the only field the facade reads.
const active = (isActive) => ({ active: isActive });

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({});
});

const baseArgs = () => ({
  formId: FORM_ID,
  tenantId: TENANT_ID,
  submissionId: SUBMISSION_ID,
  templateBody: { template: {} },
  currentUser: { usernameIdp: 'tester@idir' },
});

describe('templateUploadAndRender - validation', () => {
  it('throws 400 when formId is missing', async () => {
    await expect(docGenService.templateUploadAndRender({ templateBody: {} })).rejects.toMatchObject({ status: 400 });
    expect(featureService.resolve).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe('templateUploadAndRender - routing', () => {
  it('routes to V3 when V3 is active (V3 wins)', async () => {
    featureService.resolve.mockResolvedValueOnce(active(true)); // V3
    cdogsV3Service.templateUploadAndRender.mockResolvedValue(RESULT);

    const res = await docGenService.templateUploadAndRender(baseArgs());

    expect(res).toBe(RESULT);
    expect(cdogsV3Service.templateUploadAndRender).toHaveBeenCalledWith({ template: {} });
    expect(cdogsService.templateUploadAndRender).not.toHaveBeenCalled();
    // V2 should not even be resolved once V3 is active
    expect(featureService.resolve).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      formId: FORM_ID,
      submissionId: SUBMISSION_ID,
      tenantId: TENANT_ID,
      generatorVersion: 'v3',
      outcome: 'success',
      httpStatus: 200,
      createdBy: 'tester@idir',
    });
  });

  it('falls back to V2 when V3 is inactive but V2 is active', async () => {
    featureService.resolve.mockResolvedValueOnce(active(false)); // V3
    featureService.resolve.mockResolvedValueOnce(active(true)); // V2
    cdogsService.templateUploadAndRender.mockResolvedValue(RESULT);

    const res = await docGenService.templateUploadAndRender(baseArgs());

    expect(res).toBe(RESULT);
    expect(cdogsService.templateUploadAndRender).toHaveBeenCalledTimes(1);
    expect(cdogsV3Service.templateUploadAndRender).not.toHaveBeenCalled();
    expect(mockInsert.mock.calls[0][0]).toMatchObject({ generatorVersion: 'v2', outcome: 'success' });
  });

  it('passes {formId, tenantId} as the resolve context', async () => {
    featureService.resolve.mockResolvedValue(active(false));

    await expect(docGenService.templateUploadAndRender(baseArgs())).rejects.toBeInstanceOf(Problem);

    expect(featureService.resolve).toHaveBeenCalledWith('documentGenerationV3', { formId: FORM_ID, tenantId: TENANT_ID });
    expect(featureService.resolve).toHaveBeenCalledWith('documentGenerationV2', { formId: FORM_ID, tenantId: TENANT_ID });
  });
});

describe('templateUploadAndRender - denial', () => {
  it('throws 403 and records a denied metric when no generator is active', async () => {
    featureService.resolve.mockResolvedValue(active(false)); // both V3 and V2 inactive

    await expect(docGenService.templateUploadAndRender(baseArgs())).rejects.toMatchObject({ status: 403 });

    expect(cdogsService.templateUploadAndRender).not.toHaveBeenCalled();
    expect(cdogsV3Service.templateUploadAndRender).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      formId: FORM_ID,
      generatorVersion: 'none',
      outcome: 'denied',
    });
  });
});

describe('templateUploadAndRender - failure', () => {
  it('records a failed metric and rethrows when the generator throws', async () => {
    featureService.resolve.mockResolvedValueOnce(active(true)); // V3
    const err = new Problem(502, { detail: 'CDOGS down' });
    cdogsV3Service.templateUploadAndRender.mockRejectedValue(err);

    await expect(docGenService.templateUploadAndRender(baseArgs())).rejects.toBe(err);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      generatorVersion: 'v3',
      outcome: 'fail',
      httpStatus: 502,
      errorDetail: 'CDOGS down',
    });
  });
});

describe('normalizeErrorDetail', () => {
  const { normalizeErrorDetail } = docGenService;

  it('returns a non-empty string detail as-is', () => {
    expect(normalizeErrorDetail({ detail: 'CDOGS down' })).toBe('CDOGS down');
  });

  it('stringifies an object detail', () => {
    expect(normalizeErrorDetail({ detail: { code: 'X', errors: [1, 2] } })).toBe('{"code":"X","errors":[1,2]}');
  });

  it('falls back to message when detail is the literal "[object Object]"', () => {
    expect(normalizeErrorDetail({ detail: '[object Object]', message: 'real message' })).toBe('real message');
  });

  it('falls back to message when detail is an empty string', () => {
    expect(normalizeErrorDetail({ detail: '', message: 'real message' })).toBe('real message');
  });

  it('falls back to message when detail is an empty object', () => {
    expect(normalizeErrorDetail({ detail: {}, message: 'real message' })).toBe('real message');
  });

  it('uses message when there is no detail', () => {
    expect(normalizeErrorDetail({ message: 'just a message' })).toBe('just a message');
  });

  it('coerces a non-string/non-object detail', () => {
    expect(normalizeErrorDetail({ detail: 502 })).toBe('502');
  });

  it('returns null for a falsy error or when nothing is useful', () => {
    expect(normalizeErrorDetail(null)).toBeNull();
    expect(normalizeErrorDetail({})).toBeNull();
    expect(normalizeErrorDetail({ detail: '[object Object]' })).toBeNull();
  });

  it('falls back to message when detail is not serializable (circular)', () => {
    const circular = {};
    circular.self = circular;
    expect(normalizeErrorDetail({ detail: circular, message: 'fallback' })).toBe('fallback');
  });
});

describe('templateUploadAndRender - records normalized error detail', () => {
  it('stringifies an object detail when recording a failure', async () => {
    featureService.resolve.mockResolvedValueOnce(active(true)); // V3
    const err = new Problem(422, { detail: { field: 'template', issue: 'invalid' } });
    cdogsV3Service.templateUploadAndRender.mockRejectedValue(err);

    await expect(docGenService.templateUploadAndRender(baseArgs())).rejects.toBe(err);

    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      outcome: 'fail',
      errorDetail: '{"field":"template","issue":"invalid"}',
    });
  });
});

describe('templateUploadAndRender - metric resilience', () => {
  it('still returns the result when recording the metric fails', async () => {
    featureService.resolve.mockResolvedValueOnce(active(true)); // V3
    cdogsV3Service.templateUploadAndRender.mockResolvedValue(RESULT);
    mockInsert.mockRejectedValueOnce(new Error('db gone'));

    const res = await docGenService.templateUploadAndRender(baseArgs());

    expect(res).toBe(RESULT);
  });
});
