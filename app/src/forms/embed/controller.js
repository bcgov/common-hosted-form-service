const service = require('./service');

module.exports = {
  listAllowedDomains: async (req, res, next) => {
    try {
      const response = await service.listAllowedDomains(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  listRequestedDomains: async (req, res, next) => {
    try {
      const response = await service.listRequestedDomains(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  requestDomain: async (req, res, next) => {
    try {
      const response = await service.requestDomain(req.params.formId, req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  reviewDomainRequest: async (req, res, next) => {
    try {
      const response = await service.reviewDomainRequest(req.params.requestId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  removeDomain: async (req, res, next) => {
    try {
      await service.removeDomain(req.params.domainId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
