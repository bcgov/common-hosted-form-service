const routes = require('express').Router();

const controller = require('./controller');

routes.get('/', async (req, res, next) => {
  await controller.listApprovalStatusCodes(req, res, next);
});

module.exports = routes;
