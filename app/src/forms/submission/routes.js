const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');

routes.use(currentUser);

routes.get('/:formSubmissionId', async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:formSubmissionId', async (req, res, next) => {
  await controller.update(req, res, next);
});

module.exports = routes;
