const Problem = require('api-problem');
const cdogsV3ConfigService = require('../../../../forms/form/cdogsV3ConfigService');
const submissionService = require('../../../../forms/submission/service');

/**
 * Middleware to require CDOGS v3 access for a form.
 * Supports both submission-based routes and draft routes.
 * For submission routes: extracts formId from submission
 * For draft routes: expects formId in request body
 */
const requireCdogsV3Access = async (req, res, next) => {
  try {
    let formId;

    // Check if formId is in request body (draft template routes)
    if (req.body && req.body.formId) {
      formId = req.body.formId;
    }
    // Otherwise, fetch submission to get formId (submission-based routes)
    else if (req.params.formSubmissionId) {
      const submission = await submissionService.read(req.params.formSubmissionId);
      formId = submission.form.id;
    }

    if (!formId) {
      throw new Problem(400, { detail: 'Unable to determine form ID for CDOGS v3 access check.' });
    }

    // Check if form has CDOGS v3 access enabled
    const hasAccess = await cdogsV3ConfigService.hasV3Access(formId);
    if (!hasAccess) {
      throw new Problem(403, { detail: 'CDOGS v3 is not enabled for this form.' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireCdogsV3Access;
