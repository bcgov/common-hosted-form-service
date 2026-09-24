const service = require('./service');
const submitToEmailWorker = require('./submitToEmail/worker');

module.exports = {
  // Public catalog: definitions + global enabled (no allowlists).
  listFeatures: async (req, res, next) => {
    try {
      const response = await service.listFeatures();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  // Public resolution: { <code>: active } for the given context. Non-UUID
  // formId/tenantId values are ignored by the service (resolve as not allowlisted).
  check: async (req, res, next) => {
    try {
      const { formId, tenantId, code } = req.query;
      const response = await service.check({ formId, tenantId, code });
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  // Internal: drain the submitToEmail package job queue (called by cron via an
  // apiKey-protected route). Processes up to a bounded batch and returns a
  // summary; an optional body.batchSize overrides the configured default.
  processSubmissionPackages: async (req, res, next) => {
    try {
      const response = await submitToEmailWorker.drain(req.body?.batchSize);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
