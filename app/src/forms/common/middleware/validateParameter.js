const Problem = require('api-problem');
const uuid = require('uuid');

const constants = require('../../common/constants');
const externalApiService = require('../../form/externalApi/service');
const formService = require('../../form/service');
const submissionService = require('../../submission/service');

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
 * Validates that the :componentId route parameter exists and is a UUID.
 *
 * @param {*} _req the Express object representing the HTTP request - unused.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} componentId the :componentId value from the route.
 */
const validateComponentId = async (_req, _res, next, componentId) => {
  try {
    _validateUuid(componentId, 'componentId');

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the :documentTemplateId route parameter exists and is a UUID.
 * This validator requires that either the :formId or :formSubmissionId route
 * parameter also exists.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} documentTemplateId the :documentTemplateId value from the route.
 */
const validateDocumentTemplateId = async (req, _res, next, documentTemplateId) => {
  try {
    _validateUuid(documentTemplateId, 'documentTemplateId');

    let formId = req.params.formId;
    if (!formId) {
      const formSubmissionId = req.params.formSubmissionId;
      if (!formSubmissionId) {
        throw new Problem(404, {
          detail: 'documentTemplateId does not exist on this form',
        });
      }

      const submission = await submissionService.read(formSubmissionId);
      formId = submission.form.id;
    }

    const documentTemplate = await formService.documentTemplateRead(documentTemplateId);
    if (!documentTemplate || documentTemplate.formId !== formId) {
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
 * Validates that the :externalApiId route parameter exists and is a UUID. This
 * validator requires that the :formId route parameter also exists.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} externalAPIId the :externalAPIId value from the route.
 */
const validateExternalAPIId = async (req, _res, next, externalAPIId) => {
  try {
    _validateUuid(externalAPIId, 'externalAPIId');

    const externalApi = await externalApiService.readExternalAPI(externalAPIId);
    if (!externalApi) {
      throw new Problem(404, {
        detail: 'externalAPIId does not exist',
      });
    }
    // perform this check only if there is a formId (admin routes don't have form id)
    if (req.params.formId) {
      if (!externalApi || externalApi.formId !== req.params.formId) {
        throw new Problem(404, {
          detail: 'externalAPIId does not exist on this form',
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the :fileId route parameter exists and is a UUID.
 *
 * @param {*} _req the Express object representing the HTTP request - unused.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} fileId the :fileId value from the route.
 */
const validateFileId = async (_req, _res, next, fileId) => {
  try {
    _validateUuid(fileId, 'fileId');

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the :formId route parameter exists and is a UUID.
 *
 * @param {*} _req the Express object representing the HTTP request - unused.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} formId the :formId value from the route.
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
 * Validates that the :formSubmissionId route parameter exists and is a UUID.
 *
 * @param {*} _req the Express object representing the HTTP request - unused.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} formSubmissionId the :formSubmissionId value from the route.
 */
const validateFormSubmissionId = async (_req, _res, next, formSubmissionId) => {
  try {
    _validateUuid(formSubmissionId, 'formSubmissionId');

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the :formVersionDraftId route parameter exists and is a UUID.
 * This validator requires that the :formId route parameter also exists.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} formVersionDraftId the :formVersionDraftId value from the route.
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
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} formVersionId the :formVersionId value from the route.
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

/**
 * Validates that the :code route parameter for permissions is valid.
 *
 * @param {*} _req the Express object representing the HTTP request - unused.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} code the :code value from the route.
 */
const validatePermissionCode = async (_req, _res, next, code) => {
  try {
    if (!Object.values(constants.Permissions).includes(code)) {
      throw new Problem(400, {
        detail: 'Bad permission code',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the :code route parameter for roles is valid.
 *
 * @param {*} _req the Express object representing the HTTP request - unused.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} code the :code value from the route.
 */
const validateRoleCode = async (_req, _res, next, code) => {
  try {
    if (!Object.values(constants.Roles).includes(code)) {
      throw new Problem(400, {
        detail: 'Bad role code',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the :userId route parameter exists and is a UUID.
 *
 * @param {*} _req the Express object representing the HTTP request - unused.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @param {*} userId the :userId value from the route.
 */
const validateUserId = async (_req, _res, next, userId) => {
  try {
    _validateUuid(userId, 'userId');

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateComponentId,
  validateDocumentTemplateId,
  validateExternalAPIId,
  validateFileId,
  validateFormId,
  validateFormSubmissionId,
  validateFormVersionDraftId,
  validateFormVersionId,
  validatePermissionCode,
  validateRoleCode,
  validateUserId,
};
