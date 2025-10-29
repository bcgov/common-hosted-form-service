const routes = require('express').Router();

const validateParameter = require('../../../forms/common/middleware/validateParameter');
const apiAccess = require('../../../forms/auth/middleware/apiAccess');
const gatewayTokenVerify = require('../../common/middleware/gatewayTokenVerify');
const originAccess = require('../../common/middleware/originAccess');
const controller = require('./controller');

routes.param('formId', validateParameter.validateFormId);
routes.param('formSubmissionId', validateParameter.validateFormSubmissionId);

// Form viewer endpoints for web component
// Order: cors -> apiAccess -> originAccess -> handler
routes.get('/:formId/schema', apiAccess, gatewayTokenVerify, originAccess, async (req, res, next) => {
  await controller.readFormSchema(req, res, next);
});

routes.post('/:formId/submit', apiAccess, gatewayTokenVerify, originAccess, async (req, res, next) => {
  await controller.createSubmission(req, res, next);
});

// Read submission endpoint for webcomponent, protected by gatewayTokenVerify
routes.get('/:formId/submission/:formSubmissionId', apiAccess, gatewayTokenVerify, originAccess, async (req, res, next) => {
  await controller.readSubmission(req, res, next);
});

// Serve custom Form.io components (no authentication required)
routes.get('/components', originAccess, async (req, res, next) => {
  await controller.getCustomComponents(req, res, next);
});

// Serve base and theme styling (no authentication required)
routes.get('/styles', originAccess, async (req, res, next) => {
  await controller.getBcGovStyles(req, res, next);
});
routes.get('/theme', originAccess, async (req, res, next) => {
  await controller.getBcGovTheme(req, res, next);
});
module.exports = routes;
