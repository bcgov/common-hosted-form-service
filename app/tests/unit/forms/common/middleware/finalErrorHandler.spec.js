const express = require('express');
const Problem = require('api-problem');
const { DBError } = require('objection');
const request = require('supertest');

const { errorHandler, finalErrorHandler } = require('../../../../../src/forms/common/middleware');

//
// The two error handlers in the order app.js mounts them. The data connection
// and status service are fakes; resetConnection is the I/O edge being checked.
//
const dataConnection = { resetConnection: jest.fn() };
const statusService = { getStatus: jest.fn(() => ({ stopped: false })) };
const log = { error: jest.fn() };

const withCode = (code, message = 'error') => Object.assign(new Error(message), { code });

const appThrowing = (err) => {
  const app = express();
  app.get('/', (_req, _res, next) => next(err));
  app.use(errorHandler);
  app.use(finalErrorHandler({ dataConnection, statusService, log }));
  return request(app);
};

const expectServerError = (response, detail) => {
  expect(response.status).toBe(500);
  expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
  expect(response.body).toEqual(expect.objectContaining({ status: 500, title: 'Server Error', detail }));
};

afterEach(() => {
  jest.clearAllMocks();
  statusService.getStatus.mockImplementation(() => ({ stopped: false }));
});

describe('finalErrorHandler', () => {
  describe('responses', () => {
    it('sends a Problem(500) as it is', async () => {
      const response = await appThrowing(new Problem(500, { detail: 'Unable to upload file at this time.' })).get('/');

      expect(response.status).toBe(500);
      expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
      expect(response.body).toEqual(expect.objectContaining({ status: 500, title: 'Internal Server Error', detail: 'Unable to upload file at this time.' }));
    });

    it('wraps a plain Error with its message as the detail', async () => {
      expectServerError(await appThrowing(new Error('File type .exe is not allowed for security reasons')).get('/'), 'File type .exe is not allowed for security reasons');
    });

    it('uses a thrown string as the detail', async () => {
      expectServerError(await appThrowing('boom').get('/'), 'boom');
    });

    it('logs errors that have a stack', async () => {
      const err = new Error('boom');

      await appThrowing(err).get('/');

      expect(log.error).toBeCalledWith(err);
    });

    it('does not log errors without a stack', async () => {
      await appThrowing('boom').get('/');

      expect(log.error).not.toBeCalled();
    });

    it('leaves non-500 Problems to errorHandler', async () => {
      const response = await appThrowing(new Problem(403, { detail: 'nope' })).get('/');

      expect(response.status).toBe(403);
      expect(log.error).not.toBeCalled();
      expect(statusService.getStatus).not.toBeCalled();
    });

    it('checks the status service for every error it handles', async () => {
      await appThrowing(new Error('boom')).get('/');

      expect(statusService.getStatus).toBeCalledTimes(1);
    });
  });

  describe('does not reset the pool', () => {
    const timeout = new Error('Knex: Timeout acquiring a connection. The pool is probably full.');
    timeout.name = 'KnexTimeoutError';

    test.each([
      ['a Problem(500)', new Problem(500)],
      ['a plain Error', new Error('boom')],
      ['pool exhaustion', timeout],
      ['an Objection-wrapped query error that reaches this handler', new DBError({ nativeError: withCode('42P01', 'relation "x" does not exist') })],
      ['an Objection-wrapped server shutdown', new DBError({ nativeError: withCode('57P01', 'terminating connection due to administrator command') })],
      ['a protocol violation', new DBError({ nativeError: withCode('08P01', 'bind message has 4464 parameter formats but 0 parameters') })],
      ['a dropped connection with no code', new Error('Connection terminated unexpectedly')],
      ['another service being unreachable', Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:443'), { name: 'AxiosError', code: 'ECONNREFUSED' })],
    ])('for %s', async (_name, err) => {
      expect((await appThrowing(err).get('/')).status).toBe(500);
      expect(dataConnection.resetConnection).not.toBeCalled();
    });
  });

  describe('resets the pool', () => {
    it('for a read-only connection after failover', async () => {
      expectServerError(await appThrowing(withCode('25006', 'cannot execute INSERT in a read-only transaction')).get('/'), 'cannot execute INSERT in a read-only transaction');
      expect(dataConnection.resetConnection).toBeCalledTimes(1);
    });

    it('for an Objection-wrapped read-only connection', async () => {
      expect((await appThrowing(new DBError({ nativeError: withCode('25006', 'read-only') })).get('/')).status).toBe(500);
      expect(dataConnection.resetConnection).toBeCalledTimes(1);
    });

    it('but not while the app is stopping', async () => {
      statusService.getStatus.mockImplementation(() => ({ stopped: true }));

      expect((await appThrowing(withCode('25006')).get('/')).status).toBe(500);
      expect(dataConnection.resetConnection).not.toBeCalled();
    });
  });
});
