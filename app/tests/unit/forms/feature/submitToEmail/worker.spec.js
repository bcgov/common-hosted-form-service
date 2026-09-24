jest.mock('../../../../../src/forms/feature/submitToEmail/jobService', () => ({
  claimNext: jest.fn(),
  createJobLogger: jest.fn(() => ({ add: jest.fn(), take: jest.fn(() => '') })),
  markCompleted: jest.fn().mockResolvedValue(),
  markSkipped: jest.fn().mockResolvedValue(),
  markFailed: jest.fn().mockResolvedValue(),
}));
jest.mock('../../../../../src/forms/feature/submitToEmail/processor', () => ({
  process: jest.fn(),
}));
jest.mock('../../../../../src/forms/feature/submitToEmail/config', () => ({
  getConfig: jest.fn(() => ({ batchSize: 25 })),
}));

const jobService = require('../../../../../src/forms/feature/submitToEmail/jobService');
const processor = require('../../../../../src/forms/feature/submitToEmail/processor');
const config = require('../../../../../src/forms/feature/submitToEmail/config');
const worker = require('../../../../../src/forms/feature/submitToEmail/worker');

const job = (id) => ({ id, formId: 'f', submissionId: `s-${id}` });

beforeEach(() => {
  config.getConfig.mockReturnValue({ batchSize: 25 });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('drain', () => {
  it('processes jobs until the queue is empty and reports a summary', async () => {
    jobService.claimNext.mockResolvedValueOnce(job('j1')).mockResolvedValueOnce(job('j2')).mockResolvedValueOnce(null);
    processor.process.mockResolvedValue();

    const result = await worker.drain();

    expect(result).toEqual({ processed: 2, succeeded: 2, skipped: 0, failed: 0 });
    expect(jobService.markCompleted).toHaveBeenCalledTimes(2);
    expect(jobService.markFailed).not.toHaveBeenCalled();
  });

  it('records a failed job (markFailed) and keeps going', async () => {
    jobService.claimNext.mockResolvedValueOnce(job('j1')).mockResolvedValueOnce(job('j2')).mockResolvedValueOnce(null);
    processor.process.mockRejectedValueOnce(new Error('render failed')).mockResolvedValueOnce();

    const result = await worker.drain();

    expect(result).toEqual({ processed: 2, succeeded: 1, skipped: 0, failed: 1 });
    expect(jobService.markFailed).toHaveBeenCalledTimes(1);
    expect(jobService.markCompleted).toHaveBeenCalledTimes(1);
  });

  it('marks a skipped job (markSkipped) and tallies it separately', async () => {
    jobService.claimNext.mockResolvedValueOnce(job('j1')).mockResolvedValueOnce(job('j2')).mockResolvedValueOnce(null);
    // j1 skipped (no work by design), j2 completed (email sent)
    processor.process.mockResolvedValueOnce({ skipped: true }).mockResolvedValueOnce(undefined);

    const result = await worker.drain();

    expect(result).toEqual({ processed: 2, succeeded: 1, skipped: 1, failed: 0 });
    expect(jobService.markSkipped).toHaveBeenCalledTimes(1);
    expect(jobService.markCompleted).toHaveBeenCalledTimes(1);
    expect(jobService.markFailed).not.toHaveBeenCalled();
  });

  it('stops at the explicit maxJobs even when more are queued', async () => {
    jobService.claimNext.mockResolvedValue(job('jx')); // never empties
    processor.process.mockResolvedValue();

    const result = await worker.drain(2);

    expect(result.processed).toBe(2);
    expect(jobService.claimNext).toHaveBeenCalledTimes(2);
  });

  it('defaults the limit to the configured batch size', async () => {
    config.getConfig.mockReturnValue({ batchSize: 3 });
    jobService.claimNext.mockResolvedValue(job('jx')); // never empties
    processor.process.mockResolvedValue();

    const result = await worker.drain();

    expect(result.processed).toBe(3);
    expect(jobService.claimNext).toHaveBeenCalledTimes(3);
  });
});
