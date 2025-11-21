const routes = require('express').Router();

const controller = require('../../../forms/bcgeoaddress/controller');

// File endpoints for web component
// Order: cors -> handler (query, so no need for secured access)
routes.get('/advance/address', async (req, res, next) => {
  await controller.advanceSearchBCGeoAddress(req, res, next);
});

module.exports = routes;
