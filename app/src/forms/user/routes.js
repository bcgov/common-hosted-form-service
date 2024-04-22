const routes = require('express').Router();
const controller = require('./controller');

const currentUser = require('../auth/middleware/userAccess').currentUser;
const jwtService = require('../../components/jwtService');

routes.use(jwtService.protect());
routes.use(currentUser);

//
// User Preferences
// This must be defined before /:userId route to work as intended
//
routes.get('/preferences', async (req, res, next) => {
  await controller.readUserPreferences(req, res, next);
});

routes.put('/preferences', async (req, res, next) => {
  await controller.updateUserPreferences(req, res, next);
});

routes.delete('/preferences', async (req, res, next) => {
  await controller.deleteUserPreferences(req, res, next);
});

//
// User Labels
//
routes.get('/labels', async (req, res, next) => {
  await controller.readUserLabels(req, res, next);
});

routes.put('/labels', async (req, res, next) => {
  await controller.updateUserLabels(req, res, next);
});

//
// User
//
routes.get('/', async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.get('/:userId', async (req, res, next) => {
  await controller.read(req, res, next);
});

//
// User Form Preferences
//
routes.get('/preferences/forms/:formId', async (req, res, next) => {
  await controller.readUserFormPreferences(req, res, next);
});

routes.put('/preferences/forms/:formId', async (req, res, next) => {
  await controller.updateUserFormPreferences(req, res, next);
});

routes.delete('/preferences/forms/:formId', async (req, res, next) => {
  await controller.deleteUserFormPreferences(req, res, next);
});

module.exports = routes;
