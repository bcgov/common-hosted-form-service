const service = require('./service');
const jwtService = require('../../components/jwtService');

module.exports = {
  generateProxyHeaders: async (req, res, next) => {
    try {
      const response = await service.generateProxyHeaders(req.body, req.currentUser, jwtService.getBearerToken(req));
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  callExternalApi: async (req, res, next) => {
    try {
      const headers = await service.readProxyHeaders(req.headers);
      // read external api config
      // prepare external api call
      //
      res.status(200).json([
        {
          name: headers['username'],
          abbreviation: 'USER',
        },
        {
          name: headers['email'],
          abbreviation: 'EMAIL',
        },
      ]);
    } catch (error) {
      next(error);
    }
  },
};
