const routes = require('express').Router();

const validateParameter = require('../../../forms/common/middleware/validateParameter');
const { AuthCombinations } = require('../../../runtime-auth/security');
const chefSecurity = require('../../common/security');
const originAccess = require('../../common/middleware/originAccess');
const P = require('../../../forms/common/constants').Permissions;

const controller = require('./controller');

routes.param('formId', validateParameter.validateFormId);
routes.param('formSubmissionId', validateParameter.validateFormSubmissionId);

// Print existing submission with direct print config
routes.post(
  '/:formId/submission/:formSubmissionId/print',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.FORM_READ, P.SUBMISSION_READ],
  }),
  originAccess,
  async (req, res, next) => {
    await controller.printSubmission(req, res, next);
  }
);

// Print draft submission (no submissionId) with direct print config
routes.post(
  '/:formId/print',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.FORM_READ],
  }),
  originAccess,
  async (req, res, next) => {
    await controller.printDraft(req, res, next);
  }
);

module.exports = routes;
