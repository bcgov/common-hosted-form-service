const service = require('./service');

module.exports = {
  readPrintConfig: async (req, res, next) => {
    try {
      const response = await service.readPrintConfig(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  upsertPrintConfig: async (req, res, next) => {
    try {
      const response = await service.upsert(req.params.formId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
