const service = require('./service');

module.exports = {
  listApprovalStatusCodes: async (req, res, next) => {
    try {
      const response = await service.listApprovalStatusCodes();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
