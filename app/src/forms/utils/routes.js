const routes = require('express').Router();

const apiAccess = require('../auth/middleware/apiAccess');
const controller = require('../submission/controller');
const { currentUser } = require('../auth/middleware/userAccess');
const rateLimiter = require('../common/middleware').apiKeyRateLimiter;

routes.use(currentUser);

routes.post('/template/render', rateLimiter, apiAccess, async (req, res, next) => {
  await controller.draftTemplateUploadAndRender(req, res, next);
});

module.exports = routes;
