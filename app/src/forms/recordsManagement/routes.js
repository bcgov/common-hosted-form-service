const routes = require('express').Router();

const { currentUser, hasSubmissionPermissions, hasFormPermissions } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;
const validateParameter = require('../common/middleware/validateParameter');
const controller = require('./controller');

routes.use(currentUser);

routes.param('formId', validateParameter.validateFormId);
routes.param('formSubmissionId', validateParameter.validateFormSubmissionId);

// Gets the available retention classifications
routes.get('/classifications', controller.listRetentionClassifications);

// Schedule a submission for deletion
routes.post('/assets/:formSubmissionId/schedule', hasSubmissionPermissions([P.SUBMISSION_DELETE]), controller.scheduleDeletion);

// Cancel a scheduled deletion
routes.delete('/assets/:formSubmissionId/schedule', hasSubmissionPermissions([P.SUBMISSION_DELETE]), controller.cancelDeletion);

// Get retention policy for a form
routes.get('/containers/:formId/policies', hasFormPermissions([P.FORM_READ]), controller.getPolicy);

// Set/update retention policy for a form
routes.post('/containers/:formId/policies', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), controller.setPolicy);

// Internal: process eligible deletions (called by cron)
routes.post('/internal/deletions/process', controller.processDeletions);

// Webhook: external service calls to delete a batch (Stage 2)
routes.post('/webhooks/process-deletions', controller.processDeletionsWebhook);

module.exports = routes;
