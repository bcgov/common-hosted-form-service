const config = require('config');
const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const keycloak = require('../../components/keycloak');

routes.use(currentUser);

routes.get('/', keycloak.protect(), async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.post('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:code', keycloak.protect(), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:code', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.update(req, res, next);
});

module.exports = routes;
