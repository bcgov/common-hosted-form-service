const cors = require('cors');

const { currentUser } = require('../auth/middleware/userAccess');
const controller = require('./controller');

const routes = require('express').Router();

// need to allow cors for OPTIONS call
// formio component will call OPTIONS pre-flight
routes.options('/external', cors());

// called with encrypted headers, no current user!!!
routes.get('/external', cors(), async (_req, res, next) => {
  await controller.callExternalApi(_req, res, next);
});

routes.post('/headers', currentUser, async (_req, res, next) => {
  await controller.generateProxyHeaders(_req, res, next);
});

module.exports = routes;
