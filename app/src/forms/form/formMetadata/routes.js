const routes = require('express').Router();
const { currentUser, hasFormPermissions } = require('../../auth/middleware/userAccess');
const validateParameter = require('../../common/middleware/validateParameter');
const P = require('../../common/constants').Permissions;

const controller = require('./controller');

routes.use(currentUser);

routes.param('formId', validateParameter.validateFormId);

routes.post('/:formId/formMetadata', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:formId/formMetadata', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:formId/formMetadata', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.update(req, res, next);
});

routes.delete('/:formId/formMetadata', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
