const routes = require('express').Router();
const controller = require('./controller');

const middleware = require('../common/middleware');
const fileUpload = require('./middleware/upload').fileUpload;

const currentUser = require('../auth/middleware/userAccess').currentUser;

routes.use(currentUser);

routes.post('/', middleware.publicRateLimiter, fileUpload.upload, async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:id', async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.delete('/:id', async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
