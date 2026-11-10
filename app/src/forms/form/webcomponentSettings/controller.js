const service = require('./service');

module.exports = {
  readWebcomponentSettings: async (req, res, next) => {
    try {
      const response = await service.readSettings(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  upsertWebcomponentSettings: async (req, res, next) => {
    try {
      const response = await service.upsert(req.params.formId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
