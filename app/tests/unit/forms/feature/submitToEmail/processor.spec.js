jest.mock('../../../../../src/forms/email/emailService', () => ({ _sendEmailTemplate: jest.fn() }));
jest.mock('../../../../../src/forms/feature/submitToEmail/jobService', () => ({ setPackageFileId: jest.fn().mockResolvedValue() }));
jest.mock('../../../../../src/forms/feature/submitToEmail/contextResolver', () => ({ resolve: jest.fn() }));
jest.mock('../../../../../src/forms/feature/submitToEmail/packageBuilder', () => ({
  getSubmissionFiles: jest.fn(),
  renderReport: jest.fn(),
}));
jest.mock('../../../../../src/forms/feature/submitToEmail/delivery', () => ({ decide: jest.fn() }));
jest.mock('../../../../../src/forms/feature/submitToEmail/delivery/linkStrategy', () => ({ buildEmail: jest.fn() }));

const emailService = require('../../../../../src/forms/email/emailService');
const jobService = require('../../../../../src/forms/feature/submitToEmail/jobService');
const contextResolver = require('../../../../../src/forms/feature/submitToEmail/contextResolver');
const packageBuilder = require('../../../../../src/forms/feature/submitToEmail/packageBuilder');
const delivery = require('../../../../../src/forms/feature/submitToEmail/delivery');
const linkStrategy = require('../../../../../src/forms/feature/submitToEmail/delivery/linkStrategy');
const { PermanentError } = require('../../../../../src/forms/feature/submitToEmail/errors');
const processor = require('../../../../../src/forms/feature/submitToEmail/processor');

const strategyPrepare = jest.fn();
const fakeStrategy = { name: 'link', prepare: strategyPrepare };

// In-memory log buffer the processor writes to (flushed by the worker, not here).
const logger = { add: jest.fn() };

const okCtx = () => ({
  submission: { submission: { id: 's', confirmationId: 'ABC', deleted: false }, version: { version: 1 } },
  form: { id: 'f', name: 'My Form' },
  version: 1,
  settings: { enabled: true, emails: ['a@b.com'], templateId: 't' },
  allowed: true,
  template: { id: 't', filename: 'tpl.docx' },
});

beforeEach(() => {
  jest.clearAllMocks();
  contextResolver.resolve.mockResolvedValue(okCtx());
  packageBuilder.getSubmissionFiles.mockResolvedValue({ files: [], missing: [] });
  packageBuilder.renderReport.mockResolvedValue({ filename: 'r.pdf', buffer: Buffer.from('report') });
  delivery.decide.mockReturnValue({ strategy: fakeStrategy, reason: 'within limits' });
  strategyPrepare.mockResolvedValue({ configData: { c: 1 }, contexts: [{ to: ['a@b.com'] }], summary: 'Package built: x.', fileId: 'pkg1' });
  linkStrategy.buildEmail.mockReturnValue({ configData: { c: 2 }, contexts: [{ to: ['a@b.com'] }] });
  emailService._sendEmailTemplate.mockResolvedValue({});
});

const run = (extra) => processor.process({ jobId: 'j', formId: 'f', submissionId: 's', logger, ...extra });

describe('process — fail fast (permanent), no render/decide/build', () => {
  const expectPermanentNoWork = async () => {
    await expect(run()).rejects.toBeInstanceOf(PermanentError);
    expect(packageBuilder.renderReport).not.toHaveBeenCalled();
    expect(delivery.decide).not.toHaveBeenCalled();
    expect(strategyPrepare).not.toHaveBeenCalled();
  };

  it('submission not found', async () => {
    contextResolver.resolve.mockResolvedValue({ ...okCtx(), submission: null });
    await expectPermanentNoWork();
  });

  it('submission deleted', async () => {
    const ctx = okCtx();
    ctx.submission.submission.deleted = true;
    contextResolver.resolve.mockResolvedValue(ctx);
    await expectPermanentNoWork();
  });

  it('form not found', async () => {
    contextResolver.resolve.mockResolvedValue({ ...okCtx(), form: null });
    await expectPermanentNoWork();
  });

  it('no template configured', async () => {
    contextResolver.resolve.mockResolvedValue({ ...okCtx(), settings: { enabled: true, emails: ['a@b.com'], templateId: null } });
    await expectPermanentNoWork();
  });

  it('template not found', async () => {
    contextResolver.resolve.mockResolvedValue({ ...okCtx(), template: null });
    await expectPermanentNoWork();
  });
});

describe('process — transient errors propagate (retryable)', () => {
  it('a context resolution error is not converted to permanent', async () => {
    contextResolver.resolve.mockRejectedValue(new Error('db down'));
    await expect(run()).rejects.toThrow('db down');
    await expect(run()).rejects.not.toBeInstanceOf(PermanentError);
  });

  it('an email send error propagates', async () => {
    emailService._sendEmailTemplate.mockRejectedValue(new Error('CHES down'));
    await expect(run()).rejects.toThrow('CHES down');
  });
});

describe('process — skips (no failure, no render/build)', () => {
  it('skips when not allowlisted', async () => {
    contextResolver.resolve.mockResolvedValue({ ...okCtx(), allowed: false });
    // returns a skip signal so the worker marks the job SKIPPED (not COMPLETED)
    await expect(run()).resolves.toEqual({ skipped: true });
    expect(packageBuilder.renderReport).not.toHaveBeenCalled();
    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Skipped'));
  });

  it('skips when the setting is off', async () => {
    contextResolver.resolve.mockResolvedValue({ ...okCtx(), settings: { enabled: false, emails: ['a@b.com'], templateId: 't' } });
    await run();
    expect(packageBuilder.renderReport).not.toHaveBeenCalled();
  });

  it('skips when there are no recipients', async () => {
    contextResolver.resolve.mockResolvedValue({ ...okCtx(), settings: { enabled: true, emails: [], templateId: 't' } });
    await run();
    expect(packageBuilder.renderReport).not.toHaveBeenCalled();
  });
});

describe('process — happy path', () => {
  it('buffers per-entity logs, renders, decides delivery, builds, persists fileId, sends', async () => {
    packageBuilder.getSubmissionFiles.mockResolvedValue({
      files: [{ id: 'fa', filename: 'a.pdf', buffer: Buffer.from('a') }],
      missing: [{ id: 'fb', name: 'b.pdf', reason: 'gone' }],
    });
    const report = { filename: 'r.pdf', buffer: Buffer.from('report') };
    packageBuilder.renderReport.mockResolvedValue(report);

    await run();

    // per-entity logs buffered (not persisted per line)
    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Found submission: s'));
    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Found form: f (My Form)'));
    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Found version: 1'));
    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Found template: t (tpl.docx)'));
    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Found attachment (1): fa (a.pdf)'));
    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Attachment unreadable, skipped: fb (b.pdf)'));
    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Delivery method: link'));

    expect(delivery.decide).toHaveBeenCalledWith({ report, files: [expect.objectContaining({ id: 'fa' })] });
    expect(strategyPrepare).toHaveBeenCalledWith(expect.objectContaining({ report, files: [expect.objectContaining({ id: 'fa' })], recipients: ['a@b.com'] }));

    expect(jobService.setPackageFileId).toHaveBeenCalledWith('j', 'pkg1');
    expect(logger.add).toHaveBeenCalledWith('Package built: x.');
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith({ c: 1 }, [{ to: ['a@b.com'] }]);
    expect(logger.add).toHaveBeenCalledWith('Submission package email sent.');
  });
});

describe('process — build-once / send-retry', () => {
  it('resends the stored package without rebuilding when packageFileId is set', async () => {
    await run({ packageFileId: 'pkg-existing' });

    expect(packageBuilder.getSubmissionFiles).not.toHaveBeenCalled();
    expect(packageBuilder.renderReport).not.toHaveBeenCalled();
    expect(delivery.decide).not.toHaveBeenCalled();
    expect(jobService.setPackageFileId).not.toHaveBeenCalled();

    expect(linkStrategy.buildEmail).toHaveBeenCalledWith(expect.objectContaining({ fileId: 'pkg-existing', recipients: ['a@b.com'] }));
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith({ c: 2 }, [{ to: ['a@b.com'] }]);
    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Resending previously built package'));
  });

  it('still skips a de-allowlisted form even with a stored package', async () => {
    contextResolver.resolve.mockResolvedValue({ ...okCtx(), allowed: false });
    await run({ packageFileId: 'pkg-existing' });
    expect(linkStrategy.buildEmail).not.toHaveBeenCalled();
    expect(emailService._sendEmailTemplate).not.toHaveBeenCalled();
  });
});
