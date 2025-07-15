const Problem = require('api-problem');

const log = require('./log')(module.filename);

/**
 * Try to convert response data to JSON, but failing that just return it as-is.
 *
 * @param {*} data the data to attempt to parse into JSON.
 * @returns an object if data is JSON, otherwise data itself
 */
const _parseResponseData = (data) => {
  let parsedData;

  try {
    parsedData = JSON.parse(data);
  } catch (error) {
    // Syntax Error: It's not valid JSON.
    parsedData = data;
  }

  return parsedData;
};

module.exports = function (service, error) {
  if (error.response) {
    const data = _parseResponseData(error.response.data);

    log.error(`Error from ${service}: status = ${error.response.status}, data: ${JSON.stringify(data)}`, error);

    // Validation Error
    if (error.response.status === 422) {
      throw new Problem(error.response.status, {
        detail: data.detail,
        errors: data.errors,
      });
    }

    // Something else happened but there's a response
    throw new Problem(error.response.status, { detail: error.response.data.toString() });
  } else {
    log.error(`Unknown error calling ${service}: ${error.message}`, error);

    throw new Problem(502, `Unknown ${service} Error`, {
      detail: error.message,
    });
  }
};
