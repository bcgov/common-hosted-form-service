const config = require('config');
const routes = require('express').Router();
const apiAccess = require('../auth/middleware/apiAccess');
const { currentUser, hasFormPermissions } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;
const rateLimiter = require('../common/middleware').apiKeyRateLimiter;

const keycloak = require('../../components/keycloak');
const controller = require('./controller');

routes.use(currentUser);

routes.get('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.listForms(req, res, next);
});

routes.post('/', async (req, res, next) => {
  await controller.createForm(req, res, next);
});

routes.get('/:formId', rateLimiter, apiAccess, hasFormPermissions(P.FORM_READ), async (req, res, next) => {
  await controller.readForm(req, res, next);
});

routes.get('/:formId/export', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.export(req, res, next);
});

routes.post('/:formId/export/fields', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.exportWithFields(req, res, next);
});

routes.get('/:formId/emailTemplates', hasFormPermissions(P.EMAIL_TEMPLATE_READ), async (req, res, next) => {
  await controller.readEmailTemplates(req, res, next);
});

routes.put('/:formId/emailTemplate', hasFormPermissions([P.EMAIL_TEMPLATE_READ, P.EMAIL_TEMPLATE_UPDATE]), async (req, res, next) => {
  await controller.createOrUpdateEmailTemplate(req, res, next);
});

routes.get('/:formId/options', async (req, res, next) => {
  await controller.readFormOptions(req, res, next);
});

routes.get('/:formId/version', rateLimiter, apiAccess, hasFormPermissions(P.FORM_READ), async (req, res, next) => {
  await controller.readPublishedForm(req, res, next);
});

routes.put('/:formId', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.updateForm(req, res, next);
});

routes.delete('/:formId', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_DELETE]), async (req, res, next) => {
  await controller.deleteForm(req, res, next);
});

routes.get('/:formId/submissions', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listFormSubmissions(req, res, next);
});

routes.get('/:formId/versions/:formVersionId', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

routes.get('/:formId/versions/:formVersionId/fields', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readVersionFields(req, res, next);
});

routes.post('/:formId/versions/:formVersionId/publish', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.publishVersion(req, res, next);
});

routes.get('/:formId/versions/:formVersionId/submissions', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listSubmissions(req, res, next);
});

routes.post('/:formId/versions/:formVersionId/submissions', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_CREATE]), async (req, res, next) => {
  await controller.createSubmission(req, res, next);
});

routes.post('/:formId/versions/:formVersionId/multiSubmission', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_CREATE]), async (req, res, next) => {
  await controller.createMultiSubmission(req, res, next);
});

routes.get('/:formId/versions/:formVersionId/submissions/discover', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), (req, res, next) => {
  controller.listSubmissionFields(req, res, next);
});

routes.get('/:formId/drafts', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.listDrafts(req, res, next);
});

routes.post('/:formId/drafts', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.createDraft(req, res, next);
});

routes.get('/:formId/drafts/:formVersionDraftId', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.readDraft(req, res, next);
});

routes.put('/:formId/drafts/:formVersionDraftId', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_UPDATE]), async (req, res, next) => {
  await controller.updateDraft(req, res, next);
});

routes.delete('/:formId/drafts/:formVersionDraftId', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_DELETE]), async (req, res, next) => {
  await controller.deleteDraft(req, res, next);
});

routes.post('/:formId/drafts/:formVersionDraftId/publish', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.publishDraft(req, res, next);
});

routes.get('/:formId/statusCodes', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.getStatusCodes(req, res, next);
});

routes.get('/:formId/apiKey', hasFormPermissions(P.FORM_API_READ), async (req, res, next) => {
  await controller.readApiKey(req, res, next);
});

routes.put('/:formId/apiKey', hasFormPermissions(P.FORM_API_CREATE), async (req, res, next) => {
  await controller.createOrReplaceApiKey(req, res, next);
});

routes.delete('/:formId/apiKey', hasFormPermissions(P.FORM_API_DELETE), async (req, res, next) => {
  await controller.deleteApiKey(req, res, next);
});

routes.get('/formcomponents/proactivehelp/list', async (req, res, next) => {
  await controller.listFormComponentsProactiveHelp(req, res, next);
});

routes.get('/:formId/csvexport/fields', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readFieldsForCSVExport(req, res, next);
});

routes.get('/formcomponents/proactivehelp/imageUrl/:componentId', async (req, res, next) => {
  await controller.getFCProactiveHelpImageUrl(req, res, next);
});

routes.get('/:formId/subscriptions', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.readFormSubscriptionDetails(req, res, next);
});

routes.put('/:formId/subscriptions', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.createOrUpdateSubscriptionDetails(req, res, next);
});

module.exports = routes;
