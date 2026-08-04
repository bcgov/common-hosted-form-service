const jobService = require('./jobService');
const processor = require('./processor');
const config = require('./config');

/**
 * Claim and process a single queued job. Always resolves (a processing failure
 * is recorded on the job via markFailed, not thrown), returning what happened so
 * a drain can summarize the run.
 */
async function processOne() {
  const job = await jobService.claimNext();
  if (!job) {
    return { claimed: false };
  }

  // Per-job log buffer; flushed once by markCompleted/markFailed.
  const logger = jobService.createJobLogger();

  try {
    const result = await processor.process({
      jobId: job.id,
      formId: job.formId,
      submissionId: job.submissionId,
      packageFileId: job.packageFileId,
      logger,
    });
    if (result?.skipped) {
      await jobService.markSkipped(job.id, logger);
      return { claimed: true, jobId: job.id, ok: true, skipped: true };
    }
    await jobService.markCompleted(job.id, logger);
    return { claimed: true, jobId: job.id, ok: true, skipped: false };
  } catch (error) {
    await jobService.markFailed(job, error, logger);
    return { claimed: true, jobId: job.id, ok: false };
  }
}

/**
 * Drain the queue, processing up to `maxJobs` (defaults to the configured batch
 * size) and stopping early once the queue is empty. Bounded so a single
 * invocation — e.g. the cron-triggered endpoint — completes within request
 * limits rather than running unbounded.
 */
async function drain(maxJobs) {
  const limit = Number.isInteger(maxJobs) && maxJobs > 0 ? maxJobs : config.getConfig().batchSize;

  let processed = 0;
  let succeeded = 0;
  let skipped = 0;
  let failed = 0;

  while (processed < limit) {
    const result = await processOne();
    if (!result.claimed) {
      break;
    }
    processed += 1;
    if (!result.ok) {
      failed += 1;
    } else if (result.skipped) {
      skipped += 1;
    } else {
      succeeded += 1;
    }
  }

  return { processed, succeeded, skipped, failed };
}

module.exports = {
  drain,
  processOne,
};
