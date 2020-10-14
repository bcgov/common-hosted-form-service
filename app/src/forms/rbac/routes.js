const config = require('config');
const routes = require('express').Router();
const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const keycloak = require('../../components/keycloak');

routes.use(currentUser);

routes.get('/current', keycloak.protect(), async (req, res, next) => {
  await controller.getCurrentUser(req, res, next);
});

routes.get('/idps', async (req, res, next) => {
  await controller.getIdentityProviders(req, res, next);
});

routes.get('/forms', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.getFormUsers(req, res, next);
});

routes.put('/forms', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.setFormUsers(req, res, next);
});

routes.get('/users', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.getUserForms(req, res, next);
});

routes.put('/users', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.setUserForms(req, res, next);
});

routes.get('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.post('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:id', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:id', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.update(req, res, next);
});

routes.delete('/:id', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.delete(req, res, next);
});


module.exports = routes;
