const service = require('./service');

module.exports = {
  listFormModules: async (req, res, next) => {
    try {
      const response = await service.listFormModules(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createFormModule: async (req, res, next) => {
    try {
      const response = await service.createFormModule(req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  readFormModule: async (req, res, next) => {
    try {
      const response = await service.readFormModule(req.params.formModuleId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  updateFormModule: async (req, res, next) => {
    try {
      const response = await service.updateFormModule(req.params.formModuleId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  toggleFormModule: async (req, res, next) => {
    try {
      const response = await service.toggleFormModule(req.params.formModuleId, req.currentUser, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listFormModuleVersions: async (req, res, next) => {
    try {
      const response = await service.listFormModuleVersions(req.params.formModuleId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createFormModuleVersion: async (req, res, next) => {
    try {
      const response = await service.createFormModuleVersion(req.params.formModuleId, req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  readFormModuleVersion: async (req, res, next) => {
    try {
      const response = await service.readFormModuleVersion(req.params.formModuleVersionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  updateFormModuleVersion: async (req, res, next) => {
    try {
      const response = await service.updateFormModuleVersion(req.params.formModuleVersionId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listFormModuleIdentityProviders: async (req, res, next) => {
    try {
      const response = await service.listFormModuleIdentityProviders(req.params.formModuleId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
