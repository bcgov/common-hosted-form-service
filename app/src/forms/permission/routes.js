const routes = require('express').Router();

const jwtService = require('../../components/jwtService');
const currentUser = require('../auth/middleware/userAccess').currentUser;
const validateParameter = require('../common/middleware/validateParameter');
const controller = require('./controller');

routes.use(jwtService.protect('admin'));
routes.use(currentUser);

routes.param('code', validateParameter.validatePermissionCode);

routes.get('/', async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.get('/:code', async (req, res, next) => {
  await controller.read(req, res, next);
});

module.exports = routes;
