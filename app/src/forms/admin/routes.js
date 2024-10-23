const routes = require('express').Router();

const jwtService = require('../../components/jwtService');
const currentUser = require('../auth/middleware/userAccess').currentUser;
const validateParameter = require('../common/middleware/validateParameter');
const userController = require('../user/controller');
const controller = require('./controller');

// Routes under /admin fetch data without doing form permission checks. All
// routes in this file should remain under the "admin" role check, with the
// "admin" role only given to people who have permission to read all data.
routes.use(jwtService.protect('admin'));

routes.use(currentUser);

routes.param('componentId', validateParameter.validateComponentId);
routes.param('externalApiId', validateParameter.validateExternalAPIId);
routes.param('formId', validateParameter.validateFormId);
routes.param('formVersionId', validateParameter.validateFormVersionId);
routes.param('userId', validateParameter.validateUserId);

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
// External APIs
//

routes.get('/externalAPIs', async (req, res, next) => {
  await controller.getExternalAPIs(req, res, next);
});

routes.put('/externalAPIs/:externalApiId', async (req, res, next) => {
  await controller.updateExternalAPI(req, res, next);
});

routes.get('/externalAPIs/statusCodes', async (req, res, next) => {
  await controller.getExternalAPIStatusCodes(req, res, next);
});

//
// Form Components Help
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
