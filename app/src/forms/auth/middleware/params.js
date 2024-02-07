const Problem = require('api-problem');
const { validate } = require('uuid');

const formService = require('../../form/service');

/**
 * Validates that the :formId route parameter exists and is a UUID.
 *
 * @param {*} _req the Express object representing the HTTP request - unused
 * @param {*} _res the Express object representing the HTTP response - unused
 * @param {*} next the Express chaining function
 * @param {*} formId the :formId value from the route
 */
const validateFormId = async (_req, _res, next, formId) => {
  try {
    if (!validate(formId)) {
      throw new Problem(400, {
        detail: 'Bad formId',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the :formVersionDraftId route parameter exists and is a UUID.
 * This validator requires that the :formId route parameter also exists.
 *
 * @param {*} req the Express object representing the HTTP request
 * @param {*} _res the Express object representing the HTTP response - unused
 * @param {*} next the Express chaining function
 * @param {*} formVersionDraftId the :formVersionDraftId value from the route
 */
const validateFormVersionDraftId = async (req, _res, next, formVersionDraftId) => {
  try {
    if (!validate(formVersionDraftId)) {
      throw new Problem(400, {
        detail: 'Bad formVersionDraftId',
      });
    }

    const formVersionDraft = await formService.readDraft(formVersionDraftId);
    if (!formVersionDraft || formVersionDraft.formId !== req.params.formId) {
      throw new Problem(404, {
        detail: 'formVersionDraftId does not exist on this form',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the :formVersionId route parameter exists and is a UUID. This
 * validator requires that the :formId route parameter also exists.
 *
 * @param {*} req the Express object representing the HTTP request
 * @param {*} _res the Express object representing the HTTP response - unused
 * @param {*} next the Express chaining function
 * @param {*} formVersionId the :formVersionId value from the route
 */
const validateFormVersionId = async (req, _res, next, formVersionId) => {
  try {
    if (!validate(formVersionId)) {
      throw new Problem(400, {
        detail: 'Bad formVersionId',
      });
    }

    const formVersion = await formService.readVersion(formVersionId);
    if (!formVersion || formVersion.formId !== req.params.formId) {
      throw new Problem(404, {
        detail: 'formVersionId does not exist on this form',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateFormId,
  validateFormVersionId,
  validateFormVersionDraftId,
};
