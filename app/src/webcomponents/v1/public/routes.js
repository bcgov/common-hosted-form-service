const routes = require('express').Router();

const validateParameter = require('../../../forms/common/middleware/validateParameter');
const { AuthCombinations } = require('../../../runtime-auth/security');
const chefSecurity = require('../../common/security');
const requireAllowedOrigin = require('../../common/middleware/requireAllowedOrigin');
const requireFileUploadField = require('../../common/middleware/requireFileUploadField');
const requireUnsubmittedFormFile = require('../../common/middleware/requireUnsubmittedFormFile');
const controller = require('./controller');
const fileController = require('../../../forms/file/controller');
const fileUpload = require('../../../forms/file/middleware/upload').fileUpload;
const virusScan = require('../../../forms/file/middleware/virusScan');

const P = require('../../../forms/common/constants').Permissions;

routes.param('formId', validateParameter.validateFormId);
routes.param('fileId', validateParameter.validateFileId);

// Anonymous endpoints for Public forms embedded without an API key.
// Credentials are stripped where these routes are mounted.
// Order: runtime-auth (Public forms only) -> requireAllowedOrigin -> handler
// runtime-auth loads the published form from :formId, and the handlers use it.

const publicForm = (requiredPermissions) =>
  chefSecurity.inline({
    allowedAuth: AuthCombinations.PUBLIC_ONLY,
    requiredPermissions,
    // Always the form in the path: inferred params would name the file on the file routes
    resource: ({ params }) => ({ kind: 'publishedForm', params: { formId: params.formId } }),
  });

routes.get('/:formId/schema', publicForm([P.FORM_READ]), requireAllowedOrigin, async (req, res, next) => {
  await controller.readFormSchema(req, res, next);
});

routes.post('/:formId/submit', publicForm([P.FORM_READ, P.SUBMISSION_CREATE]), requireAllowedOrigin, async (req, res, next) => {
  await controller.createSubmission(req, res, next);
});

// Uploads are checked before the body is read, and only for a form with a file upload field
routes.post(
  '/:formId/files',
  publicForm([P.FORM_READ, P.SUBMISSION_CREATE]),
  requireAllowedOrigin,
  requireFileUploadField,
  fileUpload.upload,
  virusScan.scanFile,
  async (req, res, next) => {
    await fileController.create(req, res, next, req.securityContext.resource.form.id);
  }
);

// A submitter can read or remove their upload until it is part of a submission
routes.get('/:formId/files/:fileId', publicForm([P.FORM_READ, P.SUBMISSION_CREATE]), requireAllowedOrigin, requireUnsubmittedFormFile, async (req, res, next) => {
  await fileController.read(req, res, next);
});

// The delete itself matches the upload, so a submit that links it first keeps it
routes.delete('/:formId/files/:fileId', publicForm([P.FORM_READ, P.SUBMISSION_CREATE]), requireAllowedOrigin, async (req, res, next) => {
  await controller.deleteFile(req, res, next);
});

module.exports = routes;
