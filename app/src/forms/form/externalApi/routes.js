const routes = require('express').Router();
const { currentUser, hasFormPermissions } = require('../../auth/middleware/userAccess');
const validateParameter = require('../../common/middleware/validateParameter');
const P = require('../../common/constants').Permissions;

const controller = require('./controller');

routes.use(currentUser);

routes.param('formId', validateParameter.validateFormId);
routes.param('externalAPIId', validateParameter.validateExternalAPIId);

routes.get('/:formId/externalAPIs', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.listExternalAPIs(req, res, next);
});

routes.post('/:formId/externalAPIs', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.createExternalAPI(req, res, next);
});

routes.get('/:formId/externalAPIs/algorithms', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.listExternalAPIAlgorithms(req, res, next);
});

routes.get('/:formId/externalAPIs/statusCodes', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.listExternalAPIStatusCodes(req, res, next);
});

routes.put('/:formId/externalAPIs/:externalAPIId', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.updateExternalAPI(req, res, next);
});

routes.delete('/:formId/externalAPIs/:externalAPIId', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.deleteExternalAPI(req, res, next);
});

module.exports = routes;
