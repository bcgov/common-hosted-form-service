const Problem = require('api-problem');
const basicAuth = require('express-basic-auth');
const { validate: uuidValidate } = require('uuid');

const service = require('../../form/service');

module.exports = async (req, res, next) => {
  // Check if authorization header is basic auth
  if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Basic ')) {
    // URL params should override query string params of the same attribute
    const params = { ...req.query, ...req.params };
    let secret = ''; // Must be initialized as a string

    if (params.formId && uuidValidate(params.formId)) {
      const result = await service.readApiKey(params.formId);
      secret = result && result.secret ? result.secret : '';
    }

    const checkCredentials = basicAuth({
      // Must be a synchronous function
      authorizer: (username, password) => {
        const userMatch = params.formId && basicAuth.safeCompare(username, params.formId);
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
};
