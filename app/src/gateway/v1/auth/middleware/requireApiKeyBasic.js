const Problem = require('api-problem');
const { validate: uuidValidate } = require('uuid');

const formService = require('../../../../forms/form/service');
const { parseBasicPair } = require('../../../../runtime-auth/security/auth/utils/basicAuth');
const { validateApiKey } = require('../../../../runtime-auth/security/auth/utils/apiKeyValidation');

const HTTP_401_DETAIL = 'Invalid authorization credentials.';

const requireApiKeyBasic = async (req, res, next) => {
  try {
    const authz = req.headers?.authorization || '';
    if (!/^Basic\s+/i.test(authz)) {
      throw new Problem(401, { detail: HTTP_401_DETAIL });
    }

    const formIdParam = req.params.formId;
    if (!uuidValidate(formIdParam)) {
      throw new Problem(400, { detail: `Bad formId "${formIdParam}".` });
    }

    const pair = parseBasicPair(authz);
    if (!pair) {
      throw new Problem(401, { detail: HTTP_401_DETAIL });
    }

    const { formId, apiKey } = pair;
    if (formId !== formIdParam) {
      throw new Problem(401, { detail: HTTP_401_DETAIL });
    }

    const apiKeyRecord = await formService.readApiKey(formId);
    validateApiKey(apiKey, apiKeyRecord);

    req.apiUser = true;
    next();
  } catch (error) {
    if (error.status === 400) {
      next(error);
      return;
    }

    next(new Problem(401, { detail: HTTP_401_DETAIL }));
  }
};

module.exports = requireApiKeyBasic;
