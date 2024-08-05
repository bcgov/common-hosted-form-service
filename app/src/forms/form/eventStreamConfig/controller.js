const service = require('./service');

module.exports = {
  createEventStreamConfig: async (req, res, next) => {
    try {
      const response = await service.createEventStreamConfig(req.params.formId, req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  readEventStreamConfig: async (req, res, next) => {
    try {
      const response = await service.readEventStreamConfig(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  updateEventStreamConfig: async (req, res, next) => {
    try {
      const response = await service.updateEventStreamConfig(req.params.formId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  deleteEventStreamConfig: async (req, res, next) => {
    try {
      await service.deleteEventStreamConfig(req.params.formId, req.currentUser);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
