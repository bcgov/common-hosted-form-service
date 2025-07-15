const cors = require('cors');
const routes = require('express').Router();
const { Development } = require('../common/constants');

const controller = require('./controller');

// need to allow cors for OPTIONS call (localhost only)
// formio component will call OPTIONS pre-flight
routes.options('/advance/address', cors({ origin: Development.LOCALHOST_ORIGIN }));

routes.get('/address', async (req, res, next) => {
  await controller.searchBCGeoAddress(req, res, next);
});

routes.get('/advance/address', cors({ origin: Development.LOCALHOST_ORIGIN }), async (req, res, next) => {
  await controller.advanceSearchBCGeoAddress(req, res, next);
});

module.exports = routes;
