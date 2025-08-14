const routes = require('express').Router();
const cors = require('cors');

const validateParameter = require('../../../forms/common/middleware/validateParameter');
const apiAccess = require('../../../forms/auth/middleware/apiAccess');
const originAccess = require('../../common/middleware/originAccess');
const controller = require('./controller');

routes.param('formId', validateParameter.validateFormId);

// Form viewer endpoints for web component
// Order: cors -> apiAccess -> originAccess -> handler
routes.get('/:formId/schema', cors(), apiAccess, originAccess, async (req, res, next) => {
  await controller.readFormSchema(req, res, next);
});

routes.post('/:formId/submit', cors(), apiAccess, originAccess, async (req, res, next) => {
  await controller.createSubmission(req, res, next);
});

// Serve custom Form.io components (no authentication required)
routes.get('/components', cors(), originAccess, async (req, res, next) => {
  await controller.getCustomComponents(req, res, next);
});

// Serve base and theme styling (no authentication required)
routes.get('/styles', cors(), originAccess, async (req, res, next) => {
  await controller.getBcGovStyles(req, res, next);
});
routes.get('/theme', cors(), originAccess, async (req, res, next) => {
  await controller.getBcGovTheme(req, res, next);
});
module.exports = routes;
