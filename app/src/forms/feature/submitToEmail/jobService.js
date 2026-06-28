const { v4: uuidv4 } = require('uuid');
const { transaction, raw } = require('objection');

const { SubmissionPackageJob } = require('../../common/models');
const { PackageJobStatuses } = require('../../common/constants');
const featureService = require('../service');
const config = require('./config');

function timestamped(message) {
  return `${new Date().toISOString()} - ${message}`;
}

/**
 * Gated enqueue for a newly created submission. No-ops (returns null) for draft
 * submissions and for forms not allowed to use the feature (submitToEmail not
 * enabled+allowlisted for the form). Otherwise creates the package job record.
 *
 * The form's own enable toggle / recipients / template are intentionally NOT
 * checked here — those are evaluated at processing time, since they can change
 * between submission and processing.
 */
async function enqueueForSubmission({ formId, submissionId, draft, referer, currentUser }) {
  if (draft) {
    return null;
  }

  const submitToEmail = await featureService.resolve('submitToEmail', { formId });
  if (!submitToEmail.active) {
    return null;
  }

  return enqueue({ formId, submissionId, referer, currentUser });
}

async function enqueue({ formId, submissionId, referer, currentUser }) {
  const existing = await SubmissionPackageJob.query().findOne({
    formId,
    submissionId,
  });

  if (existing) {
    return existing;
  }

  const logEntries = [timestamped('Queued submission package job.')];

  if (referer) {
    logEntries.push(timestamped(`Referer: ${referer}`));
  }

  return SubmissionPackageJob.query().insert({
    id: uuidv4(),
    formId,
    submissionId,
    status: PackageJobStatuses.QUEUED,
    attempts: 0,
    logs: logEntries.join('\n'),
    createdBy: currentUser?.usernameIdp || 'public',
  });
}

async function claimNext() {
  // A PROCESSING job whose worker died never returns to QUEUED. Reclaim such
  // jobs once they've been PROCESSING longer than the configured stuck timeout,
  // so they aren't stranded. An actively-processing job keeps bumping updatedAt
  // (status/log writes), so it won't be falsely reclaimed.
  const { stuckTimeoutMinutes, maxAttempts } = config.getConfig();
  const stuckBefore = new Date(Date.now() - stuckTimeoutMinutes * 60 * 1000).toISOString();

  const claimedJob = await transaction(SubmissionPackageJob, async (SubmissionPackageJob) => {
    const job = await SubmissionPackageJob.query()
      .where('attempts', '<', maxAttempts)
      .where((builder) => {
        builder.where('status', PackageJobStatuses.QUEUED).orWhere((stuck) => stuck.where('status', PackageJobStatuses.PROCESSING).where('updatedAt', '<', stuckBefore));
      })
      .orderBy('createdAt', 'asc')
      .forUpdate()
      .skipLocked()
      .first();

    if (!job) {
      return null;
    }

    const reclaimed = job.status === PackageJobStatuses.PROCESSING;
    const nextAttempts = (job.attempts || 0) + 1;
    const claimMessage = reclaimed
      ? `Reclaimed stuck job (processing since ${job.updatedAt}). Attempt ${nextAttempts} of ${maxAttempts}.`
      : `Claimed by package worker. Attempt ${nextAttempts} of ${maxAttempts}.`;

    return SubmissionPackageJob.query().patchAndFetchById(job.id, {
      status: PackageJobStatuses.PROCESSING,
      attempts: nextAttempts,
      logs: [job.logs, timestamped(claimMessage)].filter(Boolean).join('\n'),
    });
  });

  return claimedJob;
}

// A per-job in-memory log buffer. claimNext already persisted that we grabbed
// the job; processing accumulates lines here (no DB per line) and they are
// flushed once at the terminal state. add() timestamps each line; take() returns
// the joined lines and clears the buffer.
function createJobLogger() {
  const lines = [];
  return {
    add: (message) => {
      lines.push(timestamped(message));
    },
    take: () => {
      const text = lines.join('\n');
      lines.length = 0;
      return text;
    },
  };
}

// Append the buffered log lines (if any) and set the status in a single write.
// SQL-concats onto the existing logs (queued/claim lines) so nothing is read or
// rewritten — atomic and O(1) regardless of how many lines were buffered.
async function flushLogs(jobId, status, logger) {
  const buffered = logger.take();
  const patch = { status };
  if (buffered) {
    patch.logs = raw("COALESCE(logs, '') || ?", [`\n${buffered}`]);
  }
  return SubmissionPackageJob.query().patchAndFetchById(jobId, patch);
}

async function setPackageFileId(jobId, packageFileId) {
  return SubmissionPackageJob.query().patchAndFetchById(jobId, { packageFileId });
}

async function markCompleted(jobId, logger) {
  logger.add('Submission package job completed.');
  return flushLogs(jobId, PackageJobStatuses.COMPLETED, logger);
}

// Terminal state for a job that did no work by design (form not allowlisted /
// setting off / no recipients) — distinct from COMPLETED (email sent) and FAILED
// (error). The skip reason was already buffered by the processor.
async function markSkipped(jobId, logger) {
  return flushLogs(jobId, PackageJobStatuses.SKIPPED, logger);
}

async function markFailed(job, error, logger) {
  // Permanent errors (missing form/submission/template, misconfiguration) cannot
  // be fixed by retrying, so fail immediately. Everything else is retried until
  // the attempt limit is reached.
  const permanent = error && error.permanent === true;
  const nextStatus = permanent || job.attempts >= config.getConfig().maxAttempts ? PackageJobStatuses.FAILED : PackageJobStatuses.QUEUED;

  logger.add(`${permanent ? 'Permanent failure' : 'Error'}: ${error.message}`);
  return flushLogs(job.id, nextStatus, logger);
}

module.exports = {
  enqueueForSubmission,
  enqueue,
  claimNext,
  createJobLogger,
  setPackageFileId,
  markCompleted,
  markSkipped,
  markFailed,
  PackageJobStatuses,
};
