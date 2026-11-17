const Problem = require('api-problem');
const { DBError, UniqueViolationError } = require('objection');

const { isConnectionError } = require('../../../src/db/connectionErrors');

const withCode = (code, message = 'error') => Object.assign(new Error(message), { code });

describe('isConnectionError', () => {
  test.each([
    ['connection_failure', withCode('08006')],
    ['sqlclient_unable_to_establish_sqlconnection', withCode('08001')],
    ['admin_shutdown', withCode('57P01')],
    ['crash_shutdown', withCode('57P02')],
    ['cannot_connect_now', withCode('57P03')],
    ['read_only_sql_transaction', withCode('25006')],
    ['ECONNRESET', withCode('ECONNRESET')],
    ['ECONNREFUSED', withCode('ECONNREFUSED')],
    ['EPIPE', withCode('EPIPE')],
    ['ETIMEDOUT', withCode('ETIMEDOUT')],
    ['an Objection-wrapped connection error', new DBError({ nativeError: withCode('57P01') })],
  ])('is true for %s', (_name, err) => {
    expect(isConnectionError(err)).toBe(true);
  });

  const timeout = new Error('Knex: Timeout acquiring a connection. The pool is probably full.');
  timeout.name = 'KnexTimeoutError';

  test.each([
    ['pool exhaustion (KnexTimeoutError)', timeout],
    ['a unique violation', withCode('23505')],
    ['an invalid uuid', withCode('22P02')],
    ['an Objection-wrapped query error', new UniqueViolationError({ nativeError: withCode('23505') })],
    ['a Problem(500)', new Problem(500)],
    ['a Problem(503)', new Problem(503)],
    ['a plain Error', new Error('boom')],
    ['a numeric code', withCode(8)],
    ['a string', 'boom'],
    ['undefined', undefined],
  ])('is false for %s', (_name, err) => {
    expect(isConnectionError(err)).toBe(false);
  });
});
