const routes = require('express').Router();

const apiAccess = require('../../auth/middleware/apiAccess');
const { currentUser, hasFormPermissions } = require('../../auth/middleware/userAccess');
const validateParameter = require('../../common/middleware/validateParameter');
const P = require('../../common/constants').Permissions;
const controller = require('./controller');

routes.use(currentUser);

routes.param('documentTemplateId', validateParameter.validateDocumentTemplateId);
routes.param('formId', validateParameter.validateFormId);

routes.get('/:formId/documentTemplates', apiAccess, hasFormPermissions([P.DOCUMENT_TEMPLATE_READ]), async (req, res, next) => {
  await controller.documentTemplateList(req, res, next);
});

routes.post('/:formId/documentTemplates', apiAccess, hasFormPermissions([P.DOCUMENT_TEMPLATE_CREATE]), async (req, res, next) => {
  await controller.documentTemplateCreate(req, res, next);
});

routes.get('/:formId/documentTemplates/:documentTemplateId', apiAccess, hasFormPermissions([P.DOCUMENT_TEMPLATE_READ]), async (req, res, next) => {
  await controller.documentTemplateRead(req, res, next);
});

routes.delete('/:formId/documentTemplates/:documentTemplateId', apiAccess, hasFormPermissions([P.DOCUMENT_TEMPLATE_DELETE]), async (req, res, next) => {
  await controller.documentTemplateDelete(req, res, next);
});

module.exports = routes;
