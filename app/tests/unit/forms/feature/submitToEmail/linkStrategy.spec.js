jest.mock('../../../../../src/forms/common/utils', () => ({ getBaseUrl: jest.fn(() => 'http://localhost') }));
jest.mock('../../../../../src/forms/feature/submitToEmail/packageBuilder', () => ({
  buildZip: jest.fn(),
  uploadPackage: jest.fn(),
}));

const packageBuilder = require('../../../../../src/forms/feature/submitToEmail/packageBuilder');
const linkStrategy = require('../../../../../src/forms/feature/submitToEmail/delivery/linkStrategy');

beforeEach(() => {
  jest.clearAllMocks();
  packageBuilder.buildZip.mockResolvedValue({ filename: 'F-ABC.zip', contentType: 'application/zip', buffer: Buffer.alloc(2048), fileCount: 2 });
  packageBuilder.uploadPackage.mockResolvedValue({ id: 'pkg-file-1' });
});

const args = () => ({
  form: { id: 'f', name: 'F' },
  submission: { submission: { id: 's', confirmationId: 'ABC' } },
  report: { filename: 'r.pdf', buffer: Buffer.from('r') },
  files: [{ id: 'fa' }, { id: 'fb' }],
  recipients: ['a@b.com'],
});

it('zips + uploads, then returns a download-link email payload + the stored fileId', async () => {
  const { configData, contexts, summary, fileId } = await linkStrategy.prepare(args());

  expect(packageBuilder.buildZip).toHaveBeenCalledWith(expect.objectContaining({ report: expect.any(Object), files: expect.any(Array) }));
  expect(packageBuilder.uploadPackage).toHaveBeenCalled();

  expect(configData.bodyTemplate).toBe('submission-package.html');
  expect(contexts[0].to).toEqual(['a@b.com']);
  expect(contexts[0].context.submissionPackageUrl).toContain('/api/v1/files/pkg-file-1');
  expect(contexts[0].context.confirmationNumber).toBe('ABC');
  expect(summary).toContain('pkg-file-1');
  // fileId returned so the processor can persist it for build-once / send-retry
  expect(fileId).toBe('pkg-file-1');
});

it('buildEmail assembles the link payload from an existing fileId without building/uploading', () => {
  const { configData, contexts } = linkStrategy.buildEmail({
    form: { id: 'f', name: 'F' },
    submission: { submission: { id: 's', confirmationId: 'ABC' } },
    recipients: ['a@b.com'],
    fileId: 'existing-file',
  });

  expect(packageBuilder.buildZip).not.toHaveBeenCalled();
  expect(packageBuilder.uploadPackage).not.toHaveBeenCalled();
  expect(configData.bodyTemplate).toBe('submission-package.html');
  expect(contexts[0].context.submissionPackageUrl).toContain('/api/v1/files/existing-file');
});

it('exposes its name', () => {
  expect(linkStrategy.name).toBe('link');
});
