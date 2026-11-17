const Problem = require('api-problem');

const { isConnectionError } = require('../../../db/connectionErrors');

/**
 * @function finalErrorHandler
 * Builds the last error handler in the chain (errorHandler has already sent
 * non-500 Problems). It logs the error and sends a Problem response. It resets
 * the database pool only when the error shows the connections themselves are
 * unusable, so failed requests cannot reset the pool.
 *
 * @param {object} deps
 * @param {object} deps.dataConnection the DataConnection whose pool is reset.
 * @param {object} deps.statusService reports whether the app is stopping.
 * @param {object} deps.log the logger.
 * @returns {Function} an Express error handler.
 */
module.exports.finalErrorHandler = ({ dataConnection, statusService, log }) => {
  // eslint-disable-next-line no-unused-vars
  return (err, _req, res, _next) => {
    if (err.stack) {
      log.error(err);
    }

    if (isConnectionError(err) && !statusService.getStatus().stopped) {
      dataConnection.resetConnection();
    }

    if (err instanceof Problem) {
      err.send(res, null);
    } else {
      new Problem(500, 'Server Error', {
        detail: err.message ? err.message : err,
      }).send(res);
    }
  };
};
