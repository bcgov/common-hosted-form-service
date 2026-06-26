const packageService = require('./packageService');
const submissionPackageProcessor = require('./submissionPackageProcessor');

const POLL_INTERVAL_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processOne() {
  const job = await packageService.claimNext();

  if (!job) {
    return false;
  }

  try {
    await packageService.appendLog(job.id, 'Started package generation.');

    await submissionPackageProcessor.process({
      jobId: job.id,
      formId: job.formId,
      submissionId: job.submissionId,
    });

    await packageService.markCompleted(job.id);
  } catch (error) {
    await packageService.markFailed(job, error);
  }

  return true;
}

async function start() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const processed = await processOne();

    if (!processed) {
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

if (require.main === module) {
  start().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Package worker crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  start,
  processOne,
};
