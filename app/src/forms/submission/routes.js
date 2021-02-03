const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;
const hasFormPermissions = require('../auth/middleware/userAccess').hasFormPermissions;
const P = require('../common/constants').Permissions;

const controller = require('./controller');

routes.use(currentUser);

routes.get('/:formSubmissionId', async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.get('/:formSubmissionId/notes', currentUser, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.getNotes(req, res, next);
});

routes.put('/:formSubmissionId', async (req, res, next) => {
  await controller.update(req, res, next);
});

routes.post('/:formSubmissionId/email', async (req, res, next) => {
  await controller.email(req, res, next);
});

module.exports = routes;
