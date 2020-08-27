const routes = require('express').Router();

const controller = require('./controller');

routes.get('/', async (req, res, next) => {
  await controller.listForms(req, res, next);
});

routes.post('/', async (req, res, next) => {
  await controller.createForm(req, res, next);
});

routes.get('/:formId', async (req, res, next) => {
  await controller.readForm(req, res, next);
});

routes.put('/:formId', async (req, res, next) => {
  await controller.updateForm(req, res, next);
});

routes.get('/:formId/versions', async (req, res, next) => {
  await controller.listVersions(req, res, next);
});

routes.post('/:formId/versions', async (req, res, next) => {
  await controller.createVersion(req, res, next);
});

routes.get('/:formId/versions/:formVersionId', async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

routes.put('/:formId/versions/:formVersionId', async (req, res, next) => {
  await controller.updateVersion(req, res, next);
});

routes.get('/:formId/versions/:formVersionId/submissions', async (req, res, next) => {
  await controller.listSubmissions(req, res, next);
});

routes.post('/:formId/versions/:formVersionId/submissions', async (req, res, next) => {
  await controller.createSubmission(req, res, next);
});

routes.get('/:formId/versions/:formVersionId/submissions/:formSubmissionId', async (req, res, next) => {
  await controller.readSubmission(req, res, next);
});

routes.put('/:formId/versions/:formVersionId/submissions/:formSubmissionId', async (req, res, next) => {
  await controller.updateSubmission(req, res, next);
});

module.exports = routes;
