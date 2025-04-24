const routes = require('express').Router();
const { currentUser } = require('../auth/middleware/userAccess');
const validateParameter = require('../common/middleware/validateParameter');

const controller = require('./controller');

routes.use(currentUser);

routes.param('formId', validateParameter.validateFormId);

routes.get('/me', async (req, res, next) => {
  await controller.getTenantsByUserId(req, res, next);
});

module.exports = routes;
