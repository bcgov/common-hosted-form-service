const cors = require('cors');
const routes = require('express').Router();
const { Development } = require('../common/constants');

const { currentUser } = require('../auth/middleware/userAccess');
const controller = require('./controller');

// need to allow cors for OPTIONS call (localhost only)
// formio component will call OPTIONS pre-flight
routes.options('/external', cors({ origin: Development.LOCALHOST_ORIGIN }));

// called with encrypted headers, no current user!!!
routes.get('/external', cors({ origin: Development.LOCALHOST_ORIGIN }), async (req, res, next) => {
  await controller.callExternalApi(req, res, next);
});

routes.post('/headers', currentUser, async (req, res, next) => {
  await controller.generateProxyHeaders(req, res, next);
});

module.exports = routes;
