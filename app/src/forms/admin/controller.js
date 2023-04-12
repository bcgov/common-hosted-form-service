const Problem = require('api-problem');
const service = require('./service');
const formService = require('../form/service');
const rbacService = require('../rbac/service');

module.exports = {
  //
  // Forms
  //
  deleteApiKey: async (req, res, next) => {
    try {
      const response = await formService.deleteApiKey(req.params.formId);
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  },
  listForms: async (req, res, next) => {
    try {
      const response = await service.listForms(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readDraft: async (req, res, next) => {
    try {
      const response = await service.readDraft(req.params.formVersionDraftId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readForm: async (req, res, next) => {
    try {
      const response = await service.readForm(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readVersion: async (req, res, next) => {
    try {
      const response = await service.readVersion(req.params.formVersionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readApiDetails: async (req, res, next) => {
    try {
      const response = await formService.readApiKey(req.params.formId);
      if (response) {
        delete response.secret;
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  restoreForm: async (req, res, next) => {
    try {
      const response = await service.restoreForm(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  //
  // Users
  //
  getUsers: async (req, res, next) => {
    try {
      const response = await service.getUsers(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getFormUserRoles: async (req, res, next) => {
    try {
      const response = await service.getFormUserRoles(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  //
  // Form Components Help Information
  //
  createFormComponentsProactiveHelp: async (req, res, next) => {
    try {
      const response = await service.createFormComponentsProactiveHelp(req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  updateFormComponentsProactiveHelp: async (req, res, next) => {
    try {
      const response = await service.updateFormComponentsProactiveHelp(req.params);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  getFCProactiveHelpImageUrl: async (req, res, next) => {
    try {
      const response = await service.getFCProactiveHelpImageUrl(req.params.componentId);
      res.status(200).send(response);
    } catch (error) {
      next(error);
    }
  },
  setFormUserRoles: async (req, res, next) => {
    try {
      // Safety guard that this admin call isn't ever used without a form or user id
      if (!req.params.formId || !req.query.userId) {
        return next(
          new Problem(422, {
            detail: 'Must supply userId and formId',
          })
        );
      }
      const response = await rbacService.setFormUsers(req.params.formId, req.query.userId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  listFormComponentsProactiveHelp: async (req, res, next) => {
    try {
      const response = await service.listFormComponentsProactiveHelp();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
