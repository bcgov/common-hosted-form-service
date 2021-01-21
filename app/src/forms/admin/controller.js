const service = require('./service');

module.exports = {
  //
  // Forms
  //
  listForms: async (req, res, next) => {
    try {
      const response = await service.listForms(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readForm:  async (req, res, next) => {
    try {
      const response = await service.readForm(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  restoreForm:  async (req, res, next) => {
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
      const response = await service.getFormUserRoles(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

};
