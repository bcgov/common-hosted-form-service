const routes = require('express').Router();

const apiAccess = require('../../../forms/auth/middleware/apiAccess');
const { currentUser, hasSubmissionPermissions } = require('../../../forms/auth/middleware/userAccess');
const P = require('../../../forms/common/constants').Permissions;
const validateParameter = require('../../../forms/common/middleware/validateParameter');
const requireCdogsV3Access = require('./middleware/requireCdogsV3Access');
const controller = require('./controller');

routes.use(currentUser);

routes.param('documentTemplateId', validateParameter.validateDocumentTemplateId);
routes.param('formSubmissionId', validateParameter.validateFormSubmissionId);

routes.get('/:formSubmissionId/template/:documentTemplateId/render', apiAccess, hasSubmissionPermissions([P.SUBMISSION_READ]), requireCdogsV3Access, async (req, res, next) => {
  await controller.templateRender(req, res, next);
});

routes.post('/:formSubmissionId/template/render', apiAccess, hasSubmissionPermissions([P.SUBMISSION_READ]), requireCdogsV3Access, async (req, res, next) => {
  await controller.templateUploadAndRender(req, res, next);
});

module.exports = routes;
