const service = require('./service');

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
};
