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

afterEach(() => {
  jest.clearAllMocks();
  statusService.getStatus.mockImplementation(() => ({ stopped: false }));
});

describe('finalErrorHandler', () => {
  describe('does not reset the pool', () => {
    it('for a Problem(500)', async () => {
      const response = await appThrowing(new Problem(500, { detail: 'Unable to upload file at this time.' })).get('/');

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe('Unable to upload file at this time.');
      expect(dataConnection.resetConnection).not.toBeCalled();
    });

    it('for a plain Error', async () => {
      const response = await appThrowing(new Error('File type .exe is not allowed for security reasons')).get('/');

      expect(response.status).toBe(500);
      expect(response.body.detail).toBe('File type .exe is not allowed for security reasons');
      expect(dataConnection.resetConnection).not.toBeCalled();
    });

    it('for pool exhaustion', async () => {
      const timeout = new Error('Knex: Timeout acquiring a connection. The pool is probably full.');
      timeout.name = 'KnexTimeoutError';

      expect((await appThrowing(timeout).get('/')).status).toBe(500);
      expect(dataConnection.resetConnection).not.toBeCalled();
    });

    it('for an Objection-wrapped query error', async () => {
      expect((await appThrowing(new DBError({ nativeError: withCode('22P02', 'invalid input syntax for type uuid') })).get('/')).status).toBe(500);
      expect(dataConnection.resetConnection).not.toBeCalled();
    });

    it('for a non-500 Problem, which errorHandler sends', async () => {
      const response = await appThrowing(new Problem(403, { detail: 'nope' })).get('/');

      expect(response.status).toBe(403);
      expect(log.error).not.toBeCalled();
      expect(dataConnection.resetConnection).not.toBeCalled();
    });
  });

  describe('resets the pool', () => {
    it('for a read-only connection after failover', async () => {
      const response = await appThrowing(withCode('25006', 'cannot execute INSERT in a read-only transaction')).get('/');

      expect(response.status).toBe(500);
      expect(dataConnection.resetConnection).toBeCalledTimes(1);
    });

    it('for an Objection-wrapped server shutdown', async () => {
      expect((await appThrowing(new DBError({ nativeError: withCode('57P01', 'terminating connection due to administrator command') })).get('/')).status).toBe(500);
      expect(dataConnection.resetConnection).toBeCalledTimes(1);
    });

    it('but not while the app is stopping', async () => {
      statusService.getStatus.mockImplementation(() => ({ stopped: true }));

      expect((await appThrowing(withCode('ECONNREFUSED')).get('/')).status).toBe(500);
      expect(dataConnection.resetConnection).not.toBeCalled();
    });
  });

  it('logs errors that reach it', async () => {
    const err = new Error('boom');

    await appThrowing(err).get('/');

    expect(log.error).toBeCalledWith(err);
  });
});
