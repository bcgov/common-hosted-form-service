const { getMockRes } = require('@jest-mock/express');
const Problem = require('api-problem');
const express = require('express');
const Objection = require('objection');
const request = require('supertest');

const middleware = require('../../../../../src/forms/common/middleware');

describe('test error handler middleware', () => {
  it('should handle an objection data error', () => {
    const error = new Objection.DataError({
      nativeError: { message: 'This is a DataError' },
    });
    const { res, next } = getMockRes();

    middleware.errorHandler(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('422'));
  });

  it('should handle an objection not found error', () => {
    const error = new Objection.NotFoundError({
      nativeError: { message: 'This is a NotFoundError' },
    });
    const { res, next } = getMockRes();

    middleware.errorHandler(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('404'));
  });

  it('should handle an objection unique violation error', () => {
    const error = new Objection.UniqueViolationError({
      nativeError: { message: 'This is a UniqueViolationError' },
    });
    const { res, next } = getMockRes();

    middleware.errorHandler(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('422'));
  });

  it('should handle an objection validation error', () => {
    const error = new Objection.ValidationError({
      nativeError: { message: 'This is a ValidationError' },
    });
    const { res, next } = getMockRes();

    middleware.errorHandler(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('422'));
  });

  it('should handle non-problem errors with a status', () => {
    const error = new Error('This is a 400 status.');
    error.status = 400;
    const { res, next } = getMockRes();

    middleware.errorHandler(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('400'));
    expect(res.end).toBeCalledWith(expect.stringContaining('This is a 400 status.'));
  });

  it('should handle non-problem errors with a status code', () => {
    const error = new Error('This is a 400 status code.');
    error.statusCode = 400;
    const { res, next } = getMockRes();

    middleware.errorHandler(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('400'));
    expect(res.end).toBeCalledWith(expect.stringContaining('This is a 400 status code.'));
  });

  it('should handle any non-500 Problems', () => {
    const error = new Problem(429);
    const { res, next } = getMockRes();

    middleware.errorHandler(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('429'));
  });

  it('should pass through unknown objection errors', () => {
    const error = new Objection.DBError({
      nativeError: {
        message: 'This base class is never actually instantiated',
      },
    });
    const { res, next } = getMockRes();

    middleware.errorHandler(error, {}, res, next);

    expect(next).toBeCalledWith(error);
  });

  it('should pass through any 500s', () => {
    const error = new Problem(500);
    const { next } = getMockRes();

    middleware.errorHandler(error, {}, {}, next);

    expect(next).toBeCalledWith(error);
  });

  it('should pass through any Errors without statuses', () => {
    const error = new Error();
    const { next } = getMockRes();

    middleware.errorHandler(error, {}, {}, next);

    expect(next).toBeCalledWith(error);
  });

  it.each([
    ['an unsatisfiable Range', { Range: 'bytes=99999999-' }, 416],
    ['a failed precondition', { 'If-Match': '"not-the-etag"' }, 412],
  ])('should keep the status of a static file error for %s', async (_name, headers, status) => {
    const app = express();
    app.use('/static', express.static(__dirname));
    app.use(middleware.errorHandler);
    // eslint-disable-next-line no-unused-vars
    const fallthrough = jest.fn((_err, _req, res, _next) => res.sendStatus(500));
    app.use(fallthrough);

    const res = await request(app).get('/static/errorHandler.spec.js').set(headers);

    expect(res.statusCode).toBe(status);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(fallthrough).not.toHaveBeenCalled();
  });
});
