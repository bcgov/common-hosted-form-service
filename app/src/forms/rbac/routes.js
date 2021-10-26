const config = require('config');
const routes = require('express').Router();

const controller = require('./controller');
const keycloak = require('../../components/keycloak');
const P = require('../common/constants').Permissions;
const { currentUser, hasFormPermissions, hasSubmissionPermissions } = require('../auth/middleware/userAccess');

routes.use(currentUser);

routes.get('/current', keycloak.protect(), async (req, res, next) => {
  await controller.getCurrentUser(req, res, next);
});

routes.get('/current/submissions', keycloak.protect(), async (req, res, next) => {
  await controller.getCurrentUserSubmissions(req, res, next);
});

routes.get('/idps', async (req, res, next) => {
  await controller.getIdentityProviders(req, res, next);
});

routes.get('/forms', hasFormPermissions(P.TEAM_READ), async (req, res, next) => {
  await controller.getFormUsers(req, res, next);
});

routes.put('/forms', hasFormPermissions(P.TEAM_UPDATE), async (req, res, next) => {
  await controller.setFormUsers(req, res, next);
});

routes.get('/submissions', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.getSubmissionUsers(req, res, next);
});

routes.put('/submissions', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.setSubmissionUserPermissions(req, res, next);
});

routes.get('/users', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.getUserForms(req, res, next);
});

routes.put('/users', hasFormPermissions(P.TEAM_UPDATE), async (req, res, next) => {
  await controller.setUserForms(req, res, next);
});

module.exports = routes;
