const embedService = require('../../embed/service');
const log = require('../../../components/log');

/**
 * Middleware to check if embedding is allowed
 * @param {Object} req The request
 * @param {Object} res The response
 * @param {Function} next The next middleware
 */
const embedSecurityMiddleware = async (req, res, next) => {
  try {
    const formId = req.params.formId;
    const origin = req.headers.origin;

    // Set default CSP to deny embedding
    let csp = "frame-ancestors 'self';";
    let xFrameOptions = 'SAMEORIGIN';

    // If we have an origin and formId, check if embedding is allowed
    if (formId && origin) {
      try {
        const isAllowed = await embedService.isEmbedAllowed(formId, origin);

        if (isAllowed) {
          // Allow embedding from the specific origin
          csp = `frame-ancestors 'self' ${origin};`;
          xFrameOptions = `ALLOW-FROM ${origin}`;
        }
      } catch (error) {
        // Log that we're defaulting to restrictive headers due to error
        log.error('Error checking embed permissions - defaulting to restrictive headers', {
          error: error.message,
          formId,
          origin,
        });
        // We intentionally continue with default restrictive headers
      }
    }

    // Set security headers
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Frame-Options', xFrameOptions);

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = embedSecurityMiddleware;
