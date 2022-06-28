const config = require('config');
const routes = require('express').Router();

const apiAccess = require('../auth/middleware/apiAccess');
const { currentUser } = require('../auth/middleware/userAccess');

const keycloak = require('../../components/keycloak');
const controller = require('./controller');

routes.use(currentUser);

routes.get('/', async (req, res, next) => {
  await controller.listFormModules(req, res, next);
});

routes.post('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.createFormModule(req, res, next);
});

routes.get('/:formModuleId', async (req, res, next) => {
  await controller.readFormModule(req, res, next);
});

routes.put('/:formModuleId', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.updateFormModule(req, res, next);
});

routes.post('/:formModuleId/toggle', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.toggleFormModule(req, res, next);
});

routes.get('/:formModuleId/version', async (req, res, next) => {
  await controller.listFormModuleVersions(req, res, next);
});

routes.post('/:formModuleId/version', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.createFormModuleVersion(req, res, next);
});

routes.get('/:formModuleId/version/:formModuleVersionId', async (req, res, next) => {
  await controller.readFormModuleVersion(req, res, next);
});

routes.get('/:formModuleId/version/:formModuleVersionId/options', async (req, res, next) => {
  await controller.readFormModuleVersionOptions(req, res, next);
});

routes.put('/:formModuleId/version/:formModuleVersionId', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.updateFormModuleVersion(req, res, next);
});

routes.get('/:formModuleId/idp', async (req, res, next) => {
  await controller.listFormModuleIdentityProviders(req, res, next);
});

module.exports = routes;
