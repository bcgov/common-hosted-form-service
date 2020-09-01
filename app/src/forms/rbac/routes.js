const routes = require('express').Router();
const keycloak = require('../../components/keycloak');
const currentUser = require('../common/middleware').currentUser;

const controller = require('./controller');

routes.get('/current', keycloak.protect(), currentUser, async (req, res, next) => {
  await controller.getCurrentUser(req, res, next);
});

routes.get('/idps', async (req, res, next) => {
  await controller.getIdentityProviders(req, res, next);
});

routes.get('/forms', async (req, res, next) => {
  await controller.getFormUsers(req, res, next);
});

routes.put('/forms', async (req, res, next) => {
  await controller.setFormUsers(req, res, next);
});

routes.get('/users', async (req, res, next) => {
  await controller.getUserForms(req, res, next);
});

routes.put('/users', async (req, res, next) => {
  await controller.setUserForms(req, res, next);
});

routes.get('/', async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.post('/', async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:id', async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:id', async (req, res, next) => {
  await controller.update(req, res, next);
});

routes.delete('/:id', async (req, res, next) => {
  await controller.delete(req, res, next);
});


module.exports = routes;
