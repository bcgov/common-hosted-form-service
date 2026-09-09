jest.mock('../../../../../src/forms/feature/service', () => ({ resolve: jest.fn() }));
jest.mock('../../../../../src/forms/common/models', () => ({
  SubmissionPackageJob: { query: jest.fn() },
}));
jest.mock('../../../../../src/forms/feature/submitToEmail/config', () => ({
  getConfig: jest.fn(() => ({ maxAttempts: 3, stuckTimeoutMinutes: 30 })),
}));

const featureService = require('../../../../../src/forms/feature/service');
const { SubmissionPackageJob } = require('../../../../../src/forms/common/models');
const jobService = require('../../../../../src/forms/feature/submitToEmail/jobService');

afterEach(() => {
  jest.clearAllMocks();
});

describe('enqueueForSubmission', () => {
  it('no-ops for a draft submission (no feature resolve, no insert)', async () => {
    const result = await jobService.enqueueForSubmission({ formId: 'f', submissionId: 's', draft: true });

    expect(result).toBeNull();
    expect(featureService.resolve).not.toHaveBeenCalled();
    expect(SubmissionPackageJob.query).not.toHaveBeenCalled();
  });

  it('no-ops when submitToEmail is not active for the form', async () => {
    featureService.resolve.mockResolvedValue({ active: false });

    const result = await jobService.enqueueForSubmission({ formId: 'f', submissionId: 's', draft: false });

    expect(result).toBeNull();
    expect(featureService.resolve).toHaveBeenCalledWith('submitToEmail', { formId: 'f' });
    expect(SubmissionPackageJob.query).not.toHaveBeenCalled();
  });

  it('creates a queued job when non-draft and the form is allowed', async () => {
    featureService.resolve.mockResolvedValue({ active: true });
    const inserted = { id: 'job-1' };
    const findOneQuery = { findOne: jest.fn().mockResolvedValue(null) };
    const insertQuery = { insert: jest.fn().mockResolvedValue(inserted) };
    // enqueue() calls query() twice: findOne (dedup) then insert.
    SubmissionPackageJob.query.mockReturnValueOnce(findOneQuery).mockReturnValueOnce(insertQuery);

    const result = await jobService.enqueueForSubmission({
      formId: 'f',
      submissionId: 's',
      draft: false,
      currentUser: { usernameIdp: 'u' },
    });

    expect(result).toEqual(inserted);
    expect(findOneQuery.findOne).toHaveBeenCalledWith({ formId: 'f', submissionId: 's' });
    expect(insertQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ formId: 'f', submissionId: 's', status: 'queued', attempts: 0, createdBy: 'u' }));
  });

  it('returns the existing job without inserting a duplicate', async () => {
    featureService.resolve.mockResolvedValue({ active: true });
    const existing = { id: 'existing-job' };
    const findOneQuery = { findOne: jest.fn().mockResolvedValue(existing) };
    SubmissionPackageJob.query.mockReturnValueOnce(findOneQuery);

    const result = await jobService.enqueueForSubmission({ formId: 'f', submissionId: 's', draft: false });

    expect(result).toEqual(existing);
    expect(SubmissionPackageJob.query).toHaveBeenCalledTimes(1); // only the dedup lookup, no insert
  });
});

describe('createJobLogger', () => {
  it('buffers timestamped lines; take() returns them joined and clears the buffer', () => {
    const logger = jobService.createJobLogger();
    logger.add('one');
    logger.add('two');

    const text = logger.take();
    expect(text).toContain('one');
    expect(text).toContain('two');
    expect(text.split('\n')).toHaveLength(2);
    expect(logger.take()).toBe(''); // cleared after take
  });
});

describe('markFailed', () => {
  const mockLogger = () => ({ add: jest.fn(), take: jest.fn(() => 'buffered text') });

  it('fails immediately (no retry) for a permanent error', async () => {
    const patchAndFetchById = jest.fn().mockResolvedValue({});
    SubmissionPackageJob.query.mockReturnValue({ patchAndFetchById });
    const logger = mockLogger();

    await jobService.markFailed({ id: 'j', attempts: 1 }, Object.assign(new Error('form not found'), { permanent: true }), logger);

    expect(logger.add).toHaveBeenCalledWith(expect.stringContaining('Permanent failure: form not found'));
    expect(patchAndFetchById).toHaveBeenCalledWith('j', expect.objectContaining({ status: 'failed' }));
  });

  it('re-queues a transient error below the attempt limit', async () => {
    const patchAndFetchById = jest.fn().mockResolvedValue({});
    SubmissionPackageJob.query.mockReturnValue({ patchAndFetchById });

    await jobService.markFailed({ id: 'j', attempts: 1 }, new Error('blip'), mockLogger());

    expect(patchAndFetchById).toHaveBeenCalledWith('j', expect.objectContaining({ status: 'queued' }));
  });

  it('fails a transient error once the attempt limit is reached', async () => {
    const patchAndFetchById = jest.fn().mockResolvedValue({});
    SubmissionPackageJob.query.mockReturnValue({ patchAndFetchById });

    await jobService.markFailed({ id: 'j', attempts: 3 }, new Error('blip'), mockLogger());

    expect(patchAndFetchById).toHaveBeenCalledWith('j', expect.objectContaining({ status: 'failed' }));
  });

  it('flushes the buffered logs in a single write — appends, no read-modify-write', async () => {
    const findById = jest.fn();
    const patchAndFetchById = jest.fn().mockResolvedValue({});
    SubmissionPackageJob.query.mockReturnValue({ findById, patchAndFetchById });
    const logger = { add: jest.fn(), take: jest.fn(() => 'line one\nline two') };

    await jobService.markFailed({ id: 'j', attempts: 1 }, new Error('boom'), logger);

    expect(findById).not.toHaveBeenCalled(); // no read before write
    const [id, patch] = patchAndFetchById.mock.calls[0];
    expect(id).toBe('j');
    expect(patch.status).toBe('queued');
    expect(patch.logs).toBeDefined(); // raw concat expression
  });
});

describe('markSkipped', () => {
  it('flushes the buffered logs and sets status to skipped', async () => {
    const patchAndFetchById = jest.fn().mockResolvedValue({});
    SubmissionPackageJob.query.mockReturnValue({ patchAndFetchById });
    const logger = { add: jest.fn(), take: jest.fn(() => 'Skipped: setting off') };

    await jobService.markSkipped('j', logger);

    const [id, patch] = patchAndFetchById.mock.calls[0];
    expect(id).toBe('j');
    expect(patch.status).toBe('skipped');
    expect(patch.logs).toBeDefined(); // appended, not rewritten
  });
});

describe('setPackageFileId', () => {
  it('patches the packageFileId on the job', async () => {
    const patchAndFetchById = jest.fn().mockResolvedValue({});
    SubmissionPackageJob.query.mockReturnValue({ patchAndFetchById });

    await jobService.setPackageFileId('j', 'file-1');

    expect(patchAndFetchById).toHaveBeenCalledWith('j', { packageFileId: 'file-1' });
  });
});
