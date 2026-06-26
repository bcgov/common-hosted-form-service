const { v4: uuidv4 } = require('uuid');
const { transaction } = require('objection');

const { SubmissionPackageJob } = require('../../common/models');
const PackageJobStatuses = require('../../common/constants');

const MAX_ATTEMPTS = 3;

function timestamped(message) {
  return `${new Date().toISOString()} - ${message}`;
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
    createdBy: currentUser?.idpUserId || currentUser?.username || 'public',
  });
}

async function claimNext() {
  const claimedJob = await transaction(SubmissionPackageJob, async (SubmissionPackageJob) => {
    const job = await SubmissionPackageJob.query()
      .where('status', PackageJobStatuses.QUEUED)
      .where('attempts', '<', MAX_ATTEMPTS)
      .orderBy('createdAt', 'asc')
      .forUpdate()
      .skipLocked()
      .first();

    if (!job) {
      return null;
    }

    const nextAttempts = (job.attempts || 0) + 1;

    return SubmissionPackageJob.query().patchAndFetchById(job.id, {
      status: PackageJobStatuses.PROCESSING,
      attempts: nextAttempts,
      logs: [job.logs, timestamped(`Claimed by package worker. Attempt ${nextAttempts} of ${MAX_ATTEMPTS}.`)].filter(Boolean).join('\n'),
    });
  });

  return claimedJob;
}

async function appendLog(jobId, message) {
  const job = await SubmissionPackageJob.query().findById(jobId);

  if (!job) return null;

  return SubmissionPackageJob.query().patchAndFetchById(jobId, {
    logs: `${job.logs || ''}\n${timestamped(message)}`,
  });
}

async function markCompleted(jobId) {
  await appendLog(jobId, 'Submission package job completed.');

  return SubmissionPackageJob.query().patchAndFetchById(jobId, {
    status: PackageJobStatuses.COMPLETED,
  });
}

async function markFailed(job, error) {
  const nextStatus = job.attempts >= MAX_ATTEMPTS ? PackageJobStatuses.FAILED : PackageJobStatuses.QUEUED;

  return SubmissionPackageJob.query().patchAndFetchById(job.id, {
    status: nextStatus,
    logs: `${job.logs || ''}\n${timestamped(`Error: ${error.message}`)}`,
  });
}

module.exports = {
  enqueue,
  claimNext,
  appendLog,
  markCompleted,
  markFailed,
  PackageJobStatuses,
};
