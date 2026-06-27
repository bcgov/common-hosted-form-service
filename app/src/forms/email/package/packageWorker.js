const packageService = require('./packageService');
const submissionPackageProcessor = require('./submissionPackageProcessor');

const POLL_INTERVAL_MS = 5000;

let running = false;

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
  running = true;

  while (running) {
    const processed = await processOne();

    if (!processed) {
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

function stop() {
  running = false;
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
  stop,
  processOne,
};
