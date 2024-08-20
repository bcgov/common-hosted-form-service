const Problem = require('api-problem');

/**
 * Checks that the API Key in the request headers matches the API Key in the
 * process environment variables.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 */
const checkApiKey = async (req, _res, next) => {
  try {
    const requestApikey = req.headers.apikey;
    if (requestApikey === undefined || requestApikey === '') {
      throw new Problem(401, {
        detail: 'No API key provided',
      });
    }

    const systemApikey = process.env.APITOKEN;
    if (requestApikey !== systemApikey) {
      throw new Problem(401, {
        detail: 'Invalid API key',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkApiKey,
};
