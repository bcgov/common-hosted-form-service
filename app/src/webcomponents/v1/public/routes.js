const routes = require('express').Router();

const validateParameter = require('../../../forms/common/middleware/validateParameter');
const { AuthCombinations } = require('../../../runtime-auth/security');
const chefSecurity = require('../../common/security');
const requireAllowedOrigin = require('../../common/middleware/requireAllowedOrigin');
const controller = require('./controller');

const P = require('../../../forms/common/constants').Permissions;

routes.param('formId', validateParameter.validateFormId);

// Anonymous endpoints for Public forms embedded without an API key.
// Credentials are stripped where these routes are mounted.
// Order: runtime-auth (Public forms only) -> requireAllowedOrigin -> handler
// runtime-auth loads the published form from :formId, and the handlers use it.

routes.get(
  '/:formId/schema',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.PUBLIC_ONLY,
    requiredPermissions: [P.FORM_READ],
    resourceSpec: { kind: 'publishedForm' },
  }),
  requireAllowedOrigin,
  async (req, res, next) => {
    await controller.readFormSchema(req, res, next);
  }
);

routes.post(
  '/:formId/submit',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.PUBLIC_ONLY,
    requiredPermissions: [P.FORM_READ, P.SUBMISSION_CREATE],
    resourceSpec: { kind: 'publishedForm' },
  }),
  requireAllowedOrigin,
  async (req, res, next) => {
    await controller.createSubmission(req, res, next);
  }
);

module.exports = routes;
