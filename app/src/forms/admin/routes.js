const config = require('config');
const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const keycloak = require('../../components/keycloak');

routes.use(keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`));
routes.use(currentUser);

routes.get('/users', async (req, res, next) => {
  await controller.getUsers(req, res, next);
});

routes.get('/formusers', async (req, res, next) => {
  await controller.getFormUserRoles(req, res, next);
});

routes.put('/formusers', async (req, res, next) => {
  await controller.setFormUserRoles(req, res, next);
});

module.exports = routes;
