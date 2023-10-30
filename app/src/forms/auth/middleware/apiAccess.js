const Problem = require('api-problem');
const basicAuth = require('express-basic-auth');
const { validate: uuidValidate } = require('uuid');

const formService = require('../../form/service');
const submissionService = require('../../submission/service');

module.exports = async (req, res, next) => {
  try {
    // Check if authorization header is basic auth
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Basic ')) {
      // URL params should override query string params of the same attribute
      const params = { ...req.query, ...req.params };

      // Basic auth is currently only used for form and submission endpoints. Use
      // the formId if it exists, otherwise fetch the formId from the submission's
      // form.
      let formId;
      if (params.formId) {
        formId = params.formId;
      } else if (params.formSubmissionId && uuidValidate(params.formSubmissionId)) {
        const result = await submissionService.read(params.formSubmissionId);
        formId = result?.form?.id;
      } else if (params.id){
        // get formId from request body
        formId = params.formId;
      }

      let secret = ''; // Must be initialized as a string

      if (formId && uuidValidate(formId)) {
        const result = await formService.readApiKey(formId);
        secret = result && result.secret ? result.secret : '';
      }

      const checkCredentials = basicAuth({  
        // Must be a synchronous function
        authorizer: (username, password) => {
          const userMatch = formId && basicAuth.safeCompare(username, formId);
          const pwMatch = secret && basicAuth.safeCompare(password, secret);

          req.apiUser = userMatch & pwMatch; // Flag current request as an API entity
          return req.apiUser;
        },
        unauthorizedResponse: () => {
          return new Problem(401, { detail: 'Invalid authorization credentials.' });
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
