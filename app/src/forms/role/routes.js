const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const jwtService = require('../../components/jwtService');

routes.use(currentUser);

routes.get('/', jwtService.protect(), async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.post('/', jwtService.protect('admin'), async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:code', jwtService.protect(), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:code', jwtService.protect('admin'), async (req, res, next) => {
  await controller.update(req, res, next);
});

module.exports = routes;
