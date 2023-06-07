const apiAccess = require('../auth/middleware/apiAccess');
const routes = require('express').Router();

const controller = require('./controller');
const P = require('../common/constants').Permissions;
const { currentUser, hasSubmissionPermissions, filterMultipleSubmissions } = require('../auth/middleware/userAccess');

routes.use(currentUser);

routes.get('/:formSubmissionId', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:formSubmissionId', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.update(req, res, next);
});

routes.delete('/:formSubmissionId', hasSubmissionPermissions(P.SUBMISSION_DELETE), async (req, res, next) => {
  await controller.delete(req, res, next);
});

routes.put('/:formSubmissionId/:formId/submissions/restore', hasSubmissionPermissions(P.SUBMISSION_DELETE), filterMultipleSubmissions(), async (req, res, next) => {
  await controller.restoreMutipleSubmissions(req, res, next);
});

routes.put('/:formSubmissionId/restore', hasSubmissionPermissions(P.SUBMISSION_DELETE), async (req, res, next) => {
  await controller.restore(req, res, next);
});

routes.get('/:formSubmissionId/options', async (req, res, next) => {
  await controller.readOptions(req, res, next);
});

routes.get('/:formSubmissionId/notes', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.getNotes(req, res, next);
});

routes.post('/:formSubmissionId/notes', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.addNote(req, res, next);
});

routes.get('/:formSubmissionId/status', apiAccess, hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.getStatus(req, res, next);
});

routes.post('/:formSubmissionId/status', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.addStatus(req, res, next);
});

routes.post('/:formSubmissionId/email', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.email(req, res, next);
});

routes.get('/:formSubmissionId/edits', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.listEdits(req, res, next);
});

routes.post('/:formSubmissionId/template/render', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.templateUploadAndRender(req, res, next);
});

routes.delete('/:formSubmissionId/:formId/submissions', hasSubmissionPermissions(P.SUBMISSION_DELETE), filterMultipleSubmissions(), async (req, res, next) => {
  await controller.deleteMutipleSubmissions(req, res, next);
});

// Implement this when we want to fetch a specific audit row including the whole old submission record
// routes.get('/:formSubmissionId/edits/:auditId', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
//   await controller.listEdits(req, res, next);
// });

module.exports = routes;
