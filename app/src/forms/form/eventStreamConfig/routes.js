const routes = require('express').Router();
const { currentUser, hasFormPermissions } = require('../../auth/middleware/userAccess');
const validateParameter = require('../../common/middleware/validateParameter');
const P = require('../../common/constants').Permissions;

const controller = require('./controller');

routes.use(currentUser);

routes.param('formId', validateParameter.validateFormId);

routes.get('/:formId/eventStreamConfig', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.readEventStreamConfig(req, res, next);
});

module.exports = routes;
