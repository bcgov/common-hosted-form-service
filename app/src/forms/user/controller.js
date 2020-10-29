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
  }

};
