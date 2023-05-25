const routes = require('express').Router();

const controller = require('../submission/controller');
const { currentUser } = require('../auth/middleware/userAccess');

routes.use(currentUser);

routes.post('/template/render', async (req, res, next) => {
  await controller.draftTemplateUploadAndRender(req, res, next);
});

module.exports = routes;
