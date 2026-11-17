const Problem = require('api-problem');
const { DBError, UniqueViolationError } = require('objection');

const { isConnectionError } = require('../../../src/db/connectionErrors');

const withCode = (code, message = 'error') => Object.assign(new Error(message), { code });

describe('isConnectionError', () => {
  test.each([
    ['read_only_sql_transaction', withCode('25006', 'cannot execute INSERT in a read-only transaction')],
    ['an Objection-wrapped read_only_sql_transaction', new DBError({ nativeError: withCode('25006') })],
  ])('is true for %s', (_name, err) => {
    expect(isConnectionError(err)).toBe(true);
  });

  const timeout = new Error('Knex: Timeout acquiring a connection. The pool is probably full.');
  timeout.name = 'KnexTimeoutError';

  // An axios error for another service that is down: it carries a socket code.
  const axiosRefused = Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:443'), { name: 'AxiosError', code: 'ECONNREFUSED', isAxiosError: true });

  test.each([
    // Connections that break are disposed by knex; no reset is needed.
    ['admin_shutdown', new DBError({ nativeError: withCode('57P01', 'terminating connection due to administrator command') })],
    ['crash_shutdown', withCode('57P02')],
    ['cannot_connect_now', withCode('57P03')],
    ['connection_failure', withCode('08006')],
    ['protocol_violation, which a request can provoke', withCode('08P01')],
    ['a dropped connection with no code', new Error('Connection terminated unexpectedly')],
    ['a pg socket error', withCode('ECONNRESET')],
    ['another service being unreachable', axiosRefused],
    ['pool exhaustion (KnexTimeoutError)', timeout],
    ['a unique violation', withCode('23505')],
    ['an Objection-wrapped query error', new UniqueViolationError({ nativeError: withCode('23505') })],
    ['a Problem(500)', new Problem(500)],
    ['a plain Error', new Error('boom')],
    ['a numeric code', withCode(25006)],
    ['a string', 'boom'],
    ['undefined', undefined],
  ])('is false for %s', (_name, err) => {
    expect(isConnectionError(err)).toBe(false);
  });
});
