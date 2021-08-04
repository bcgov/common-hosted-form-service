const Problem = require('api-problem');
const basicAuth = require('express-basic-auth');
const { validate: uuidValidate } = require('uuid');

const { readApiKey } = require('../../form/service');

module.exports = async (req, res, next) => {
  // Check if authorization header is basic auth
  if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Basic ')) {
    // URL params should override query string params of the same attribute
    const params = { ...req.query, ...req.params };
    let secret = ''; // Must be initialized as a string

    if (params.formId && uuidValidate(params.formId)) {
      const result = await readApiKey(params.formId);
      secret = result.secret;
    }

    const checkCredentials = basicAuth({
      // Must be a synchronous function
      authorizer: (username, password) => {
        const userMatch = params.formId && basicAuth.safeCompare(username, params.formId);
        const pwMatch = secret && basicAuth.safeCompare(password, secret);
        return userMatch & pwMatch;
      },
      unauthorizedResponse: () => {
        return new Problem(401, { detail: 'Invalid authorization credentials.' });
      }
    });

    req.apiUser = true; // Flag current request as an API entity
    return checkCredentials(req, res, next);
  } else {
    next();
  }
};
