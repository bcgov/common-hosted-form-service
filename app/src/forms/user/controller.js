const service = require('./service');

module.exports = {
  list: async (req, res, next) => {
    try {
      const response = await service.list(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  read:  async (req, res, next) => {
    try {
      const response = await service.read(req.params.userId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const response = await service.update(req.params.userId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  deleteUserFormPreferences: async (req, res, next) => {
    try {
      await service.deleteUserFormPreferences(req.currentUser, req.params.formId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  readUserFormPreferences: async (req, res, next) => {
    try {
      const response = await service.readUserFormPreferences(req.currentUser, req.params.formId);
      res.status(200).json(response || {});
    } catch (error) {
      next(error);
    }
  },

  updateUserFormPreferences: async (req, res, next) => {
    try {
      const response = await service.updateUserFormPreferences(req.currentUser, req.params.formId, req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
