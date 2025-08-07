const routes = require('express').Router();
const cors = require('cors');

const validateParameter = require('../common/middleware/validateParameter');
const apiAccess = require('../auth/middleware/apiAccess');
const controller = require('./controller');

routes.param('formId', validateParameter.validateFormId);

// Public API endpoints for web component
routes.get('/:formId/schema', cors(), apiAccess, async (req, res, next) => {
  await controller.readFormSchemaForWidget(req, res, next);
});

routes.post('/:formId/submit', cors(), apiAccess, async (req, res, next) => {
  await controller.createSubmissionForWidget(req, res, next);
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
