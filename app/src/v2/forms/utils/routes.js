const routes = require('express').Router();

const { currentUser } = require('../../../forms/auth/middleware/userAccess');
const requireCdogsV3Access = require('../submission/middleware/requireCdogsV3Access');
const controller = require('../submission/controller');

routes.use(currentUser);

routes.post('/template/render', requireCdogsV3Access, async (req, res, next) => {
  await controller.draftTemplateUploadAndRender(req, res, next);
});

module.exports = routes;
