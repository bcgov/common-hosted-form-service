const routes = require('express').Router();

const { currentUser } = require('../auth/middleware/userAccess');
const controller = require('../submission/controller');

routes.use(currentUser);

routes.post('/template/render', async (req, res, next) => {
  await controller.draftTemplateUploadAndRender(req, res, next);
});

module.exports = routes;
