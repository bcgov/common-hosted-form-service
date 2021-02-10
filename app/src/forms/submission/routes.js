const routes = require('express').Router();

const controller = require('./controller');
const currentUser = require('../auth/middleware/userAccess').currentUser;

routes.use(currentUser);

routes.get('/:formSubmissionId', async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:formSubmissionId', async (req, res, next) => {
  await controller.update(req, res, next);
});

routes.get('/:formSubmissionId/notes', async (req, res, next) => {
  await controller.getNotes(req, res, next);
});

routes.post('/:formSubmissionId/notes', async (req, res, next) => {
  await controller.addNote(req, res, next);
});

routes.get('/:formSubmissionId/status', async (req, res, next) => {
  await controller.getStatus(req, res, next);
});

routes.post('/:formSubmissionId/status', async (req, res, next) => {
  await controller.addStatus(req, res, next);
});


routes.post('/:formSubmissionId/email', async (req, res, next) => {
  await controller.email(req, res, next);
});

module.exports = routes;
