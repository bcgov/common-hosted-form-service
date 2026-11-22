const Problem = require('api-problem');
const basicAuth = require('express-basic-auth');
const { NotFoundError } = require('objection');
const { validate: uuidValidate } = require('uuid');

const formService = require('../../form/service');
const submissionService = require('../../submission/service');
const fileService = require('../../file/service');

const HTTP_401_DETAIL = 'Invalid authorization credentials.';
const HTTP_403_DETAIL = 'You do not have access to this resource.';

/**
 * Gets the Form ID that corresponds to a given File ID. An unknown file and a
 * file not yet attached to a submission get the same 401 as bad credentials,
 * so a caller cannot tell them apart from an attached file.
 *
 * @param uuid fileId that has a corresponding Form ID.
 * @returns a UUID for form that the File ID belongs to.
 * @throws Problem if there is a UUID validation error, or no form.
 */
const _getFormIdFromFileId = async (fileId) => {
  if (!uuidValidate(fileId)) {
    throw new Problem(400, { detail: `Bad fileId "${fileId}".` });
  }

  let file;
  try {
    file = await fileService.read(fileId);
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
  }

  if (!file?.formSubmissionId) {
    throw new Problem(401, { detail: HTTP_401_DETAIL });
  }

  return _getFormIdFromSubmissionId(file.formSubmissionId);
};

/**
 * Gets the Form ID that corresponds to a given Submission ID.
 *
 * @param uuid formSubmissionId that has a corresponding Form ID.
 * @returns a UUID for form that the Submission ID belongs to.
 * @throws Problem if there is a UUID validation error.
 */
const _getFormIdFromSubmissionId = async (formSubmissionId) => {
  if (!uuidValidate(formSubmissionId)) {
    throw new Problem(400, { detail: `Bad formSubmissionId "${formSubmissionId}".` });
  }

  const result = await submissionService.read(formSubmissionId);

  return result?.form?.id;
};

/**
 * Gets the Form ID of the resource the route names: its formId, else the form
 * of its formSubmissionId, else the form of its fileId. Only route parameters
 * decide the form; a formId in the query string is used only by a route with
 * none of these, and must otherwise name the same form. A query formId that
 * names another form gets the same 401 as bad credentials, so a caller cannot
 * use it to learn which form a resource belongs to.
 *
 * @param {*} req the Express request.
 * @returns a UUID for form that the requested data belongs to.
 * @throws Problem if there is a validation error or the query names another form.
 */
const _getFormId = async (req) => {
  const { formId, formSubmissionId, fileId } = req.params;
  const queryFormId = req.query?.formId;
  if (queryFormId !== undefined && typeof queryFormId !== 'string') {
    throw new Problem(400, { detail: 'Bad formId.' });
  }

  let resourceFormId;
  if (formId) {
    resourceFormId = formId;
  } else if (formSubmissionId) {
    resourceFormId = await _getFormIdFromSubmissionId(formSubmissionId);
  } else if (fileId) {
    resourceFormId = await _getFormIdFromFileId(fileId);
  } else {
    resourceFormId = queryFormId;
  }

  if (resourceFormId !== undefined && !uuidValidate(resourceFormId)) {
    throw new Problem(400, { detail: `Bad formId "${resourceFormId}".` });
  }

  if (queryFormId !== undefined && queryFormId !== resourceFormId) {
    throw new Problem(401, { detail: HTTP_401_DETAIL });
  }

  return resourceFormId;
};

module.exports = async (req, res, next) => {
  try {
    // Check if authorization header is basic auth
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Basic ')) {
      // Get the form ID of the resource the route names (Form ID, Form
      // Submission ID, or File Upload ID).
      const formId = await _getFormId(req);
      if (!formId) {
        throw new Problem(401, { detail: HTTP_401_DETAIL });
      }

      const apiKey = await formService.readApiKey(formId);
      if (!apiKey || !apiKey.secret) {
        throw new Problem(401, { detail: HTTP_401_DETAIL });
      }

      if (req.params.fileId && apiKey.filesApiAccess === false) {
        throw new Problem(403, { detail: HTTP_403_DETAIL });
      }

      const secret = apiKey.secret;

      const checkCredentials = basicAuth({
        // Must be a synchronous function
        authorizer: (username, password) => {
          const userMatch = formId && basicAuth.safeCompare(username, formId);
          const pwMatch = secret && basicAuth.safeCompare(password, secret);

          req.apiUser = userMatch & pwMatch; // Flag current request as an API entity
          return req.apiUser;
        },
        unauthorizedResponse: () => {
          return new Problem(401, { detail: HTTP_401_DETAIL });
        },
      });

      return checkCredentials(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
};
