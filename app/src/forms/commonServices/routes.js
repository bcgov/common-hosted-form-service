const routes = require('express').Router();

const controller = require('./controller');

routes.get('/css/idir/users', async (req, res, next) => {
  await controller.queryIdirUsers(req, res, next);
});

module.exports = routes;
