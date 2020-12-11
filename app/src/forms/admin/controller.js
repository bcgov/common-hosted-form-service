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
  },
  setFormUserRoles: async (req, res, next) => {
    try {
      const response = await service.setFormUserRoles(req.query, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

};
