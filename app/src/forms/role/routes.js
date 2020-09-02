const routes = require('express').Router();

const controller = require('./controller');

routes.get('/', async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.post('/', async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:code', async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:code', async (req, res, next) => {
  await controller.update(req, res, next);
});

module.exports = routes;
