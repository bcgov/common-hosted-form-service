const cssService = require('../../components/cssService');

module.exports = {
  queryIdirUsers: async (req, res, next) => {
    try {
      const users = await cssService.queryIdirUsers(req.query);
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  },
};
