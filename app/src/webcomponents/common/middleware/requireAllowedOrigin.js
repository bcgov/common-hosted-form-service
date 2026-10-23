const Problem = require('api-problem');

const webcomponentSettingsService = require('../../../forms/form/webcomponentSettings/service');

/**
 * Anonymous routes only: the request's Origin must be one of the allowed origins
 * of the form in the path. Runs after runtime-auth, which has already confirmed
 * that the path form uses the Public identity provider.
 */
module.exports = async function requireAllowedOrigin(req, res, next) {
  try {
    // The response depends on the Origin, so shared caches must not reuse it across origins
    res.vary('Origin');

    const origin = webcomponentSettingsService.normalizeOrigin(req.get('origin'));
    const allowedOrigins = origin ? await webcomponentSettingsService.readAllowedOrigins(req.params.formId) : [];

    if (!allowedOrigins.includes(origin)) {
      return next(new Problem(403, { detail: 'This website is not allowed to embed this form.' }));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
