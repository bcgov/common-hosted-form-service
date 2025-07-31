const routes = require('express').Router();

const controller = require('./controller');
const validateParameter = require('../common/middleware/validateParameter');

const { currentUser } = require('../auth/middleware/userAccess');

routes.use(currentUser);

routes.param('corsOriginRequestId', validateParameter.validateCorsOriginRequestId);

routes.get('/', async (req, res, next) => {
  await controller.getCurrentUserCorsOriginRequests(req, res, next);
});

routes.post('/', async (req, res, next) => {
  await controller.createCurrentUserCorsOriginRequest(req, res, next);
});

routes.put('/:corsOriginRequestId', async (req, res, next) => {
  await controller.updateCurrentUserCorsOriginRequest(req, res, next);
});

routes.delete('/:corsOriginRequestId', async (req, res, next) => {
  await controller.deleteCurrentUserCorsOriginRequest(req, res, next);
});

module.exports = routes;
