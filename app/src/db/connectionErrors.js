/**
 * Errors that mean the pool holds connections that are alive but unusable, so
 * only destroying and rebuilding the knex pool recovers.
 *
 * Connections that break (server restart, crash, dropped socket) do not need a
 * reset: knex marks them disposed and the pool discards them on the next
 * acquire. A reset is costly: while it runs the pool waits for every connection
 * in use and hands out none, so all database work on the pod stalls.
 */

// Postgres SQLSTATE codes.
const RESET_CODES = new Set([
  '25006', // read_only_sql_transaction: the connection is on a server that is no longer the primary
]);

/**
 * @function isConnectionError
 * True when the error shows the pool's connections are unusable. Reads the
 * error code from the error, or from `nativeError` for Objection-wrapped
 * errors. Errors from other services (for example an axios ECONNREFUSED) and
 * pool exhaustion (KnexTimeoutError) are not connection errors.
 *
 * @param {*} err the error.
 * @returns {boolean}
 */
const isConnectionError = (err) => {
  const code = err?.code ?? err?.nativeError?.code;
  return typeof code === 'string' && RESET_CODES.has(code);
};

module.exports = { isConnectionError };
