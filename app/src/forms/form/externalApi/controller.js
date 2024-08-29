const service = require('./service');

module.exports = {
  listExternalAPIs: async (req, res, next) => {
    try {
      const response = await service.listExternalAPIs(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listExternalAPIAlgorithms: async (req, res, next) => {
    try {
      const response = await service.listExternalAPIAlgorithms();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listExternalAPIStatusCodes: async (req, res, next) => {
    try {
      const response = await service.listExternalAPIStatusCodes();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createExternalAPI: async (req, res, next) => {
    try {
      const response = await service.createExternalAPI(req.params.formId, req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  updateExternalAPI: async (req, res, next) => {
    try {
      const response = await service.updateExternalAPI(req.params.formId, req.params.externalAPIId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  deleteExternalAPI: async (req, res, next) => {
    try {
      await service.deleteExternalAPI(req.params.formId, req.params.externalAPIId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
};
