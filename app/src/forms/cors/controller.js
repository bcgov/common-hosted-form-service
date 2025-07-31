const service = require('./service');

module.exports = {
  getCurrentUserCorsOriginRequests: async (req, res, next) => {
    try {
      const response = await service.getCurrentUserCorsOriginRequests(req.currentUser, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  createCurrentUserCorsOriginRequest: async (req, res, next) => {
    try {
      const response = await service.createCurrentUserCorsOriginRequest(req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  updateCurrentUserCorsOriginRequest: async (req, res, next) => {
    try {
      const response = await service.updateCurrentUserCorsOriginRequest(req.params.corsOriginRequestId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  deleteCurrentUserCorsOriginRequest: async (req, res, next) => {
    try {
      const response = await service.deleteCurrentUserCorsOriginRequest(req.params.corsOriginRequestId, req.currentUser);
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  }
};
