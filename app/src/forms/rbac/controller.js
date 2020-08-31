const service = require('./service');

module.exports = {
  list: async (req, res, next) => {
    try {
      const response = await service.list();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  create:  async (req, res, next) => {
    try {
      const response = await service.create(req.body);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  read:  async (req, res, next) => {
    try {
      const response = await service.read(req.params.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  update:  async (req, res, next) => {
    try {
      const response = await service.update(req.params.id, req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  delete:  async (req, res, next) => {
    try {
      const response = await service.delete(req.params.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getCurrentUser:  async (req, res, next) => {
    try {
      const response = await service.getCurrentUser(req.currentUser, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getFormUsers:  async (req, res, next) => {
    try {
      const response = await service.getFormUsers(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  setFormUsers:  async (req, res, next) => {
    try {
      const response = await service.setFormUsers(req.query.formId, req.query.userId, req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getUserForms:  async (req, res, next) => {
    try {
      const response = await service.getUserForms(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  setUserForms:  async (req, res, next) => {
    try {
      const response = await service.setUserForms(req.query.userId, req.query.formId, req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getIdentityProviders:  async (req, res, next) => {
    try {
      const response = await service.getIdentityProviders(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

};
