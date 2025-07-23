const routes = require('express').Router();

const { currentUser } = require('../auth/middleware/userAccess');
const jwtService = require('../../components/jwtService');
const controller = require('./controller');

routes.use(currentUser);

routes.get('/', async (req, res, next) => {
  await controller.listFormModules(req, res, next);
});

routes.post('/', jwtService.protect('admin'), async (req, res, next) => {
  await controller.createFormModule(req, res, next);
});

routes.get('/:formModuleId', async (req, res, next) => {
  await controller.readFormModule(req, res, next);
});

routes.put('/:formModuleId', jwtService.protect('admin'), async (req, res, next) => {
  await controller.updateFormModule(req, res, next);
});

routes.post('/:formModuleId/toggle', jwtService.protect('admin'), async (req, res, next) => {
  await controller.toggleFormModule(req, res, next);
});

routes.get('/:formModuleId/version', async (req, res, next) => {
  await controller.listFormModuleVersions(req, res, next);
});

routes.post('/:formModuleId/version', jwtService.protect('admin'), async (req, res, next) => {
  await controller.createFormModuleVersion(req, res, next);
});

routes.get('/:formModuleId/version/:formModuleVersionId', async (req, res, next) => {
  await controller.readFormModuleVersion(req, res, next);
});

routes.put('/:formModuleId/version/:formModuleVersionId', jwtService.protect('admin'), async (req, res, next) => {
  await controller.updateFormModuleVersion(req, res, next);
});

routes.get('/:formModuleId/idp', async (req, res, next) => {
  await controller.listFormModuleIdentityProviders(req, res, next);
});

module.exports = routes;
