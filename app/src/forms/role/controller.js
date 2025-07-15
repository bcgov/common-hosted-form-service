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

  read: async (req, res, next) => {
    try {
      const response = await service.read(req.params.code);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
