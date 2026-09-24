jest.mock('../../../../../src/forms/feature/service', () => ({ resolve: jest.fn() }));
jest.mock('../../../../../src/forms/form/service', () => ({ readForm: jest.fn() }));
jest.mock('../../../../../src/forms/submission/service', () => ({ read: jest.fn() }));
jest.mock('../../../../../src/forms/form/documentTemplate/service', () => ({ documentTemplateRead: jest.fn() }));

const featureService = require('../../../../../src/forms/feature/service');
const formService = require('../../../../../src/forms/form/service');
const submissionService = require('../../../../../src/forms/submission/service');
const documentTemplateService = require('../../../../../src/forms/form/documentTemplate/service');
const contextResolver = require('../../../../../src/forms/feature/submitToEmail/contextResolver');

const notFound = () => Object.assign(new Error('not found'), { name: 'NotFoundError' });

const okSubmission = { submission: { id: 's' }, version: { version: 4 } };
const okForm = { id: 'f', name: 'F', submissionPackageSettings: { enabled: true, emails: ['a@b.com'], templateId: 't' } };
const okTemplate = { id: 't', filename: 'tpl.docx' };

beforeEach(() => {
  jest.clearAllMocks();
  submissionService.read.mockResolvedValue(okSubmission);
  formService.readForm.mockResolvedValue(okForm);
  featureService.resolve.mockResolvedValue({ active: true });
  documentTemplateService.documentTemplateRead.mockResolvedValue(okTemplate);
});

const run = () => contextResolver.resolve({ formId: 'f', submissionId: 's' });

it('resolves all entities + version + allowed when everything is present', async () => {
  const ctx = await run();
  expect(ctx).toEqual({
    submission: okSubmission,
    form: okForm,
    version: 4,
    settings: okForm.submissionPackageSettings,
    allowed: true,
    template: okTemplate,
  });
});

it('returns null (not throw) for a missing submission, and null version', async () => {
  submissionService.read.mockRejectedValue(notFound());
  const ctx = await run();
  expect(ctx.submission).toBeNull();
  expect(ctx.version).toBeNull();
});

it('returns null for a missing form (and null settings)', async () => {
  formService.readForm.mockRejectedValue(notFound());
  const ctx = await run();
  expect(ctx.form).toBeNull();
  expect(ctx.settings).toBeNull();
});

it('returns null template when configured but missing', async () => {
  documentTemplateService.documentTemplateRead.mockRejectedValue(notFound());
  const ctx = await run();
  expect(ctx.template).toBeNull();
});

it('does not look up a template when none is configured', async () => {
  formService.readForm.mockResolvedValue({ ...okForm, submissionPackageSettings: { enabled: true, emails: ['a@b.com'], templateId: null } });
  const ctx = await run();
  expect(ctx.template).toBeNull();
  expect(documentTemplateService.documentTemplateRead).not.toHaveBeenCalled();
});

it('propagates a transient (non-not-found) error', async () => {
  submissionService.read.mockRejectedValue(new Error('db down'));
  await expect(run()).rejects.toThrow('db down');
});

it('reflects allowed=false when submitToEmail is inactive', async () => {
  featureService.resolve.mockResolvedValue({ active: false });
  const ctx = await run();
  expect(ctx.allowed).toBe(false);
});
