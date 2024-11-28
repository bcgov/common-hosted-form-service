const routes = require('express').Router();

const { currentUser } = require('../auth/middleware/userAccess');
const controller = require('./controller');

// called with encrypted headers, no current user!!!
routes.get('/external', async (req, res, next) => {
  await controller.callExternalApi(req, res, next);
});

routes.post('/headers', currentUser, async (req, res, next) => {
  await controller.generateProxyHeaders(req, res, next);
});

module.exports = routes;
