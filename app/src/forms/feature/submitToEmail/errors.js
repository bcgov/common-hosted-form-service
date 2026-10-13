// Thrown for job failures that retrying cannot fix — missing form / submission /
// template, or a misconfiguration. jobService.markFailed sets the job to FAILED
// immediately for these (no re-queue), whereas ordinary errors (CDOGS, storage,
// CHES) are treated as transient and retried up to the attempt limit.
class PermanentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PermanentError';
    this.permanent = true;
  }
}

module.exports = { PermanentError };
