const routes = require('express').Router();

const controller = require('./controller');

routes.get('/address', async (req, res, next) => {
  await controller.searchBCGeoAddress(req, res, next);
});

routes.get('/advance/address', async (req, res, next) => {
  await controller.advanceSearchBCGeoAddress(req, res, next);
});

module.exports = routes;
