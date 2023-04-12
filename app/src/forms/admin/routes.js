const config = require('config');
const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const userController = require('../user/controller');
const keycloak = require('../../components/keycloak');

// Always have this applied to all routes here
routes.use(keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`));
routes.use(currentUser);

// Routes under the /admin pathing will fetch data without doing Form permission checks in the database
// As such, this should ALWAYS remain under the :admin role check and that KC role should not be given out
// other than to people who have permission to read all data

//
// Forms
//
routes.get('/forms', async (req, res, next) => {
  await controller.listForms(req, res, next);
});

routes.get('/forms/:formId', async (req, res, next) => {
  await controller.readForm(req, res, next);
});

routes.delete('/forms/:formId/apiKey', async (req, res, next) => {
  await controller.deleteApiKey(req, res, next);
});

routes.get('/forms/:formId/apiKey', async (req, res, next) => {
  await controller.readApiDetails(req, res, next);
});

routes.put('/forms/:formId/restore', async (req, res, next) => {
  await controller.restoreForm(req, res, next);
});

routes.get('/forms/:formId/versions/:formVersionId', async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

routes.get('/forms/:formId/formUsers', async (req, res, next) => {
  await controller.getFormUserRoles(req, res, next);
});

routes.put('/forms/:formId/addUser', async (req, res, next) => {
  await controller.setFormUserRoles(req, res, next);
});

//
// Users
//
routes.get('/users', async (req, res, next) => {
  await controller.getUsers(req, res, next);
});

routes.get('/users/:userId', async (req, res, next) => {
  await userController.read(req, res, next);
});

//
//Form componets help info
//

routes.post('/formcomponents/proactivehelp/object', async (req, res, next) => {
  await controller.createFormComponentsProactiveHelp(req, res, next);
});

routes.put('/formcomponents/proactivehelp/:publishStatus/:componentId', async (req, res, next) => {
  await controller.updateFormComponentsProactiveHelp(req, res, next);
});

routes.get('/formcomponents/proactivehelp/imageUrl/:componentId', async (req, res, next) => {
  await controller.getFCProactiveHelpImageUrl(req, res, next);
});

routes.get('/formcomponents/proactivehelp/list', async (req, res, next) => {
  await controller.listFormComponentsProactiveHelp(req, res, next);
});

module.exports = routes;
