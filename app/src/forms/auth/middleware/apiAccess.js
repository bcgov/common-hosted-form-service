const Problem = require('api-problem');
const basicAuth = require('express-basic-auth');
const { validate: uuidValidate } = require('uuid');

const { readApiKey } = require('../../form/service');

module.exports = async (req, res, next) => {
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
      const userMatch = basicAuth.safeCompare(username, params.formId);
      const pwMatch = basicAuth.safeCompare(password, secret);
      return userMatch & pwMatch;
    },
    unauthorizedResponse: () => {
      return new Problem(401, { detail: 'Invalid authorization credentials.' });
    }
  });

  return checkCredentials(req, res, next);
};
