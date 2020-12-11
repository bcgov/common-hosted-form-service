const config = require('config');
const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
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


//
// Users
//
routes.get('/users', async (req, res, next) => {
  await controller.getUsers(req, res, next);
});

routes.get('/formusers', async (req, res, next) => {
  await controller.getFormUserRoles(req, res, next);
});

routes.put('/formusers', async (req, res, next) => {
  await controller.setFormUserRoles(req, res, next);
});

module.exports = routes;
