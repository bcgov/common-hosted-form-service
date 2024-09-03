const routes = require('express').Router();

const jwtService = require('../../components/jwtService');
const { currentUser, hasFormPermissions, hasFormRoles, hasRoleDeletePermissions, hasRoleModifyPermissions, hasSubmissionPermissions } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;
const R = require('../common/constants').Roles;
const controller = require('./controller');

routes.use(currentUser);

routes.get('/current', jwtService.protect(), async (req, res, next) => {
  await controller.getCurrentUser(req, res, next);
});

routes.get('/current/submissions', jwtService.protect(), async (req, res, next) => {
  await controller.getCurrentUserSubmissions(req, res, next);
});

routes.get('/idps', async (req, res, next) => {
  await controller.getIdentityProviders(req, res, next);
});

routes.get('/forms', hasFormPermissions([P.TEAM_READ]), async (req, res, next) => {
  await controller.getFormUsers(req, res, next);
});

routes.put('/forms', hasFormPermissions([P.TEAM_UPDATE]), async (req, res, next) => {
  await controller.setFormUsers(req, res, next);
});

routes.get('/submissions', hasSubmissionPermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.getSubmissionUsers(req, res, next);
});

routes.put('/submissions', hasSubmissionPermissions([P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.setSubmissionUserPermissions(req, res, next);
});

routes.get('/users', jwtService.protect('admin'), async (req, res, next) => {
  await controller.getUserForms(req, res, next);
});

routes.put('/users', hasFormPermissions([P.TEAM_UPDATE]), hasFormRoles([R.OWNER, R.TEAM_MANAGER]), hasRoleModifyPermissions, async (req, res, next) => {
  await controller.setUserForms(req, res, next);
});

routes.delete('/users', hasFormPermissions([P.TEAM_UPDATE]), hasFormRoles([R.OWNER, R.TEAM_MANAGER]), hasRoleDeletePermissions, async (req, res, next) => {
  await controller.removeMultiUsers(req, res, next);
});

module.exports = routes;
