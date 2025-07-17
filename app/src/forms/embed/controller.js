const service = require('./service');

module.exports = {
  getFormEmbedDomainStatusCodes: async (req, res, next) => {
    try {
      const response = await service.getFormEmbedDomainStatusCodes();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  listDomains: async (req, res, next) => {
    try {
      const response = await service.listDomains(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  getDomainHistory: async (req, res, next) => {
    try {
      const response = await service.getDomainHistory(req.params.formEmbedDomainId);
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

  removeDomain: async (req, res, next) => {
    try {
      await service.removeDomain(req.params.formEmbedDomainId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
