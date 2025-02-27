const service = require('./service');

module.exports = {
  getTenantsByUserId: async (req, res, next) => {
    try {
      const response = await service.getTenantsByUserId(req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
