const apiAccess = require('../auth/middleware/apiAccess');
const routes = require('express').Router();

const controller = require('./controller');
const P = require('../common/constants').Permissions;
const { currentUser, hasSubmissionPermissions, filterMultipleSubmissions } = require('../auth/middleware/userAccess');
const rateLimiter = require('../common/middleware').apiKeyRateLimiter;
const validateParameter = require('../common/middleware/validateParameter');

routes.use(currentUser);

routes.param('documentTemplateId', validateParameter.validateDocumentTemplateId);

routes.get('/:formSubmissionId', rateLimiter, apiAccess, hasSubmissionPermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:formSubmissionId', hasSubmissionPermissions([P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.update(req, res, next);
});

routes.delete('/:formSubmissionId', rateLimiter, apiAccess, hasSubmissionPermissions([P.SUBMISSION_DELETE]), async (req, res, next) => {
  await controller.delete(req, res, next);
});

routes.put('/:formSubmissionId/:formId/submissions/restore', hasSubmissionPermissions([P.SUBMISSION_DELETE]), filterMultipleSubmissions, async (req, res, next) => {
  await controller.restoreMutipleSubmissions(req, res, next);
});

routes.put('/:formSubmissionId/restore', hasSubmissionPermissions([P.SUBMISSION_DELETE]), async (req, res, next) => {
  await controller.restore(req, res, next);
});

routes.get('/:formSubmissionId/options', async (req, res, next) => {
  await controller.readOptions(req, res, next);
});

routes.get('/:formSubmissionId/notes', hasSubmissionPermissions([P.SUBMISSION_REVIEW]), async (req, res, next) => {
  await controller.getNotes(req, res, next);
});

routes.post('/:formSubmissionId/notes', hasSubmissionPermissions([P.SUBMISSION_REVIEW]), async (req, res, next) => {
  await controller.addNote(req, res, next);
});

routes.get('/:formSubmissionId/status', rateLimiter, apiAccess, hasSubmissionPermissions([P.SUBMISSION_REVIEW]), async (req, res, next) => {
  await controller.getStatus(req, res, next);
});

routes.post('/:formSubmissionId/status', hasSubmissionPermissions([P.SUBMISSION_REVIEW]), async (req, res, next) => {
  await controller.addStatus(req, res, next);
});

routes.post('/:formSubmissionId/email', hasSubmissionPermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.email(req, res, next);
});

routes.get('/:formSubmissionId/edits', hasSubmissionPermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listEdits(req, res, next);
});

routes.get('/:formSubmissionId/template/:documentTemplateId/render', rateLimiter, apiAccess, hasSubmissionPermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.templateRender(req, res, next);
});

routes.post('/:formSubmissionId/template/render', rateLimiter, apiAccess, hasSubmissionPermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.templateUploadAndRender(req, res, next);
});

routes.delete('/:formSubmissionId/:formId/submissions', hasSubmissionPermissions([P.SUBMISSION_DELETE]), filterMultipleSubmissions, async (req, res, next) => {
  await controller.deleteMutipleSubmissions(req, res, next);
});

module.exports = routes;
