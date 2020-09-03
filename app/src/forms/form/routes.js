const routes = require('express').Router();
const currentUser = require('../auth/middleware/userAccess').currentUser;
const hasFormPermissions = require('../auth/middleware/userAccess').hasFormPermissions;
const P = require('../common/constants').Permissions;

const controller = require('./controller');

routes.use(currentUser);

routes.get('/', async (req, res, next) => {
  await controller.listForms(req, res, next);
});

routes.post('/', async (req, res, next) => {
  await controller.createForm(req, res, next);
});

routes.get('/:formId', hasFormPermissions(P.FORM_READ), async (req, res, next) => {
  await controller.readForm(req, res, next);
});

routes.put('/:formId', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.updateForm(req, res, next);
});

routes.get('/:formId/versions', hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.listVersions(req, res, next);
});

routes.post('/:formId/versions', hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.createVersion(req, res, next);
});

routes.get('/:formId/versions/:formVersionId', hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

routes.put('/:formId/versions/:formVersionId', hasFormPermissions([P.FORM_READ, P.DESIGN_UPDATE]), async (req, res, next) => {
  await controller.updateVersion(req, res, next);
});

routes.get('/:formId/versions/:formVersionId/submissions', hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listSubmissions(req, res, next);
});

routes.post('/:formId/versions/:formVersionId/submissions', hasFormPermissions([P.FORM_READ, P.SUBMISSION_CREATE]), async (req, res, next) => {
  await controller.createSubmission(req, res, next);
});

routes.get('/:formId/versions/:formVersionId/submissions/:formSubmissionId', hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.readSubmission(req, res, next);
});

routes.put('/:formId/versions/:formVersionId/submissions/:formSubmissionId', hasFormPermissions([P.FORM_READ, P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.updateSubmission(req, res, next);
});

module.exports = routes;
