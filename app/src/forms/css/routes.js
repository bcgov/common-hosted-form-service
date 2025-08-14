const routes = require('express').Router();

const controller = require('./controller');

routes.get('/idir/users', async (req, res, next) => {
  await controller.queryIdirUsers(req, res, next);
});

module.exports = routes;
