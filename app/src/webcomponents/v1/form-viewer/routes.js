const routes = require('express').Router();

const validateParameter = require('../../../forms/common/middleware/validateParameter');
const { AuthCombinations } = require('../../../runtime-auth/security');
const chefSecurity = require('../../common/security');
const originAccess = require('../../common/middleware/originAccess');
const controller = require('./controller');

const P = require('../../../forms/common/constants').Permissions;

routes.param('formId', validateParameter.validateFormId);
routes.param('formSubmissionId', validateParameter.validateFormSubmissionId);

// Form viewer endpoints for web component
// Order: runtime-auth -> originAccess -> handler

// Schema endpoint - API auth (auto-infers formOnly from :formId)
routes.get(
  '/:formId/schema',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.FORM_READ],
  }),
  originAccess,
  async (req, res, next) => {
    await controller.readFormSchema(req, res, next);
  }
);

// Submit endpoint - API auth (auto-infers formOnly from :formId)
routes.post(
  '/:formId/submit',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.FORM_READ, P.SUBMISSION_CREATE],
  }),
  originAccess,
  async (req, res, next) => {
    await controller.createSubmission(req, res, next);
  }
);

// Read submission endpoint - API auth (auto-infers submissionFromForm from both params)
routes.get(
  '/:formId/submission/:formSubmissionId',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.FORM_READ, P.SUBMISSION_READ],
  }),
  originAccess,
  async (req, res, next) => {
    await controller.readSubmission(req, res, next);
  }
);

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
