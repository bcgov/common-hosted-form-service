const routes = require('express').Router();

const apiAccess = require('../public/middleware/apiAccess');
const { currentUser, hasSubmissionPermissions, hasFormPermissions } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;
const validateParameter = require('../common/middleware/validateParameter');
const controller = require('./controller');

routes.param('formId', validateParameter.validateFormId);
routes.param('formSubmissionId', validateParameter.validateFormSubmissionId);

// Gets the available retention classifications
routes.get('/classifications', controller.listRetentionClassifications);

// Schedule a submission for deletion
routes.post('/assets/:formSubmissionId/schedule', currentUser, hasSubmissionPermissions([P.SUBMISSION_DELETE]), controller.scheduleDeletion);

// Cancel a scheduled deletion
routes.delete('/assets/:formSubmissionId/schedule', currentUser, hasSubmissionPermissions([P.SUBMISSION_DELETE]), controller.cancelDeletion);

// Get retention policy for a form
routes.get('/containers/:formId/policies', currentUser, hasFormPermissions([P.FORM_READ]), controller.getPolicy);

// Set/update retention policy for a form
routes.post('/containers/:formId/policies', currentUser, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), controller.setPolicy);

// Delete retention policy for a form
routes.delete('/containers/:formId/policies', currentUser, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), controller.deletePolicy);

// Internal: process eligible deletions (called by cron)
routes.post('/internal/deletions/process', apiAccess.checkApiKey, controller.processDeletions);

// Webhook: external service calls to delete a batch (Stage 2)
routes.post('/webhooks/process-deletions', controller.processDeletionsWebhook);

module.exports = routes;
