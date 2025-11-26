const service = require('./service');
module.exports = {
  sendReminderToSubmitter: async (req, res, next) => {
    try {
      const response = await service.sendReminderToSubmitter();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
