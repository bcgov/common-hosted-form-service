/**
 * Errors that mean the database connections themselves are unusable, as
 * opposed to a query that failed. Only these justify destroying and rebuilding
 * the knex pool: knex already discards individual broken connections, and a
 * reset aborts every in-flight query on the pod.
 */

// Postgres SQLSTATE codes. Class 08 (connection exception) is matched by prefix.
const SQLSTATE_CODES = new Set([
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  '25006', // read_only_sql_transaction: the server is no longer the primary
]);

// Socket errors raised by the pg driver.
const SOCKET_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ETIMEDOUT']);

/**
 * @function isConnectionError
 * True when the error shows the database connections are unusable. Reads the
 * error code from the error, or from `nativeError` for Objection-wrapped errors.
 * Pool exhaustion (KnexTimeoutError) is not a connection error: a reset only
 * makes it worse.
 *
 * @param {*} err the error.
 * @returns {boolean}
 */
const isConnectionError = (err) => {
  const code = err?.code ?? err?.nativeError?.code;
  if (typeof code !== 'string') return false;
  return code.startsWith('08') || SQLSTATE_CODES.has(code) || SOCKET_CODES.has(code);
};

module.exports = { isConnectionError };
