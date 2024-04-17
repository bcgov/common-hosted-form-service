const Problem = require('api-problem');
const uuid = require('uuid');

const formService = require('../../form/service');

/**
 * Throws a 400 problem if the parameter is not a valid UUID.
 *
 * @param {*} parameter the parameter to validate as a UUID.
 * @param {*} parameterName the name of the parameter to use in 400 Problems.
 * @throws Problem if the parameter is not a valid UUID.
 */
const _validateUuid = (parameter, parameterName) => {
  if (!uuid.validate(parameter)) {
    throw new Problem(400, {
      detail: 'Bad ' + parameterName,
    });
  }
};

/**
 * Validates that the :documentTemplateId route parameter exists and is a UUID.
 * This validator requires that the :formId route parameter also exists.
 *
 * @param {*} req the Express object representing the HTTP request
 * @param {*} _res the Express object representing the HTTP response - unused
 * @param {*} next the Express chaining function
 * @param {*} documentTemplateId the :documentTemplateId value from the route
 */
const validateDocumentTemplateId = async (req, _res, next, documentTemplateId) => {
  try {
    _validateUuid(documentTemplateId, 'documentTemplateId');

    const documentTemplate = await formService.documentTemplateRead(documentTemplateId);
    if (!documentTemplate || documentTemplate.formId !== req.params.formId) {
      throw new Problem(404, {
        detail: 'documentTemplateId does not exist on this form',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

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
    _validateUuid(formId, 'formId');

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
    _validateUuid(formVersionDraftId, 'formVersionDraftId');

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
    _validateUuid(formVersionId, 'formVersionId');

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
  validateDocumentTemplateId,
  validateFormId,
  validateFormVersionId,
  validateFormVersionDraftId,
};
