const routes = require('express').Router();

const controller = require('./controller');

routes.post('/address', async (req, res, next) => {
  console.log(req);
  await controller.searchBCGeoAddress(req, res, next);
});

module.exports = routes;
