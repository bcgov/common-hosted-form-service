const log = require('npmlog');
const Problem = require('api-problem');

module.exports = function (service, e) {
  if (e.response) {
    log.error(`Error from ${service}: status = ${e.response.status}, data : ${e.response.data}`);
    // Validation Error
    if (e.response.status === 422) {
      throw new Problem(e.response.status, {
        detail: e.response.data.detail,
        errors: JSON.parse(e.response.data).errors
      });
    }
    // Something else happened but there's a response
    throw new Problem(e.response.status, {detail: e.response.data.toString()});
  } else {
    log.error(`Unknown error calling ${service}: ${e.message}`);
    throw new Problem(502, `Unknown ${service} Error`, {detail: e.message});
  }
};
