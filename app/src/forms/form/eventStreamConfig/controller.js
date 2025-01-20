const service = require('./service');

module.exports = {
  readEventStreamConfig: async (req, res, next) => {
    try {
      const response = await service.readEventStreamConfig(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
