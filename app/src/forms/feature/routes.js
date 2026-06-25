const routes = require('express').Router();

const controller = require('./controller');

// Public read endpoints. Feature configuration (allowlists, allowAll) is mutated
// only through the admin module, which is guarded by jwtService.protect('admin').

routes.get('/', async (req, res, next) => {
  await controller.listFeatures(req, res, next);
});

routes.get('/check', async (req, res, next) => {
  await controller.check(req, res, next);
});

module.exports = routes;
