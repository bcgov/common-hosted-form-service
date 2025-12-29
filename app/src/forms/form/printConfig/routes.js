const routes = require('express').Router();
const { currentUser, hasFormPermissions } = require('../../auth/middleware/userAccess');
const apiAccess = require('../../auth/middleware/apiAccess');
const validateParameter = require('../../common/middleware/validateParameter');
const P = require('../../common/constants').Permissions;

const controller = require('./controller');

routes.use(currentUser);

routes.param('formId', validateParameter.validateFormId);

routes.get('/:formId/printConfig', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readPrintConfig(req, res, next);
});

routes.put('/:formId/printConfig', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE, P.DOCUMENT_TEMPLATE_READ]), async (req, res, next) => {
  await controller.upsertPrintConfig(req, res, next);
});

module.exports = routes;
