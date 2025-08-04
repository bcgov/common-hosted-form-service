const routes = require('express').Router();
const cors = require('cors');

const validateParameter = require('../../../forms/common/middleware/validateParameter');
const apiAccess = require('../../../forms/auth/middleware/apiAccess');
const controller = require('./controller');

routes.param('formId', validateParameter.validateFormId);

// Form viewer endpoints for web component
routes.get('/:formId/schema', cors(), apiAccess, async (req, res, next) => {
  await controller.readFormSchema(req, res, next);
});

routes.post('/:formId/submit', cors(), apiAccess, async (req, res, next) => {
  await controller.createSubmission(req, res, next);
});

// Serve custom Form.io components (no authentication required)
routes.get('/components', cors(), async (req, res, next) => {
  await controller.getCustomComponents(req, res, next);
});

// Serve BC Gov styling (no authentication required)
routes.get('/styles', cors(), async (req, res, next) => {
  await controller.getBcGovStyles(req, res, next);
});

module.exports = routes;
