const config = require('config');
const routes = require('express').Router();
const controller = require('./controller');

const currentUser = require('../auth/middleware/userAccess').currentUser;
const keycloak = require('../../components/keycloak');

routes.use(keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`));
routes.use(currentUser);

routes.get('/', async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.get('/:userId', async (req, res, next) => {
  await controller.read(req, res, next);
});

module.exports = routes;
