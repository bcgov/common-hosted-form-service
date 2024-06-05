const { getMockRes } = require('@jest-mock/express');
const Problem = require('api-problem');
const Objection = require('objection');

const middleware = require('../../../../../src/forms/common/middleware');

describe('test data errors middleware', () => {
  it('should handle an objection data error', () => {
    const error = new Objection.DataError({
      nativeError: { message: 'This is a DataError' },
    });
    const { res } = getMockRes();
    const next = jest.fn();

    middleware.dataErrors(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('422'));
  });

  it('should handle an objection not found error', () => {
    const error = new Objection.NotFoundError({
      nativeError: { message: 'This is a NotFoundError' },
    });
    const { res } = getMockRes();
    const next = jest.fn();

    middleware.dataErrors(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('404'));
  });

  it('should handle an objection unique violation error', () => {
    const error = new Objection.UniqueViolationError({
      nativeError: { message: 'This is a UniqueViolationError' },
    });
    const { res } = getMockRes();
    const next = jest.fn();

    middleware.dataErrors(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('422'));
  });

  it('should handle an objection validation error', () => {
    const error = new Objection.ValidationError({
      nativeError: { message: 'This is a ValidationError' },
    });
    const { res } = getMockRes();
    const next = jest.fn();

    middleware.dataErrors(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('422'));
  });

  it('should handle any non-500 Problems', () => {
    const error = new Problem(429);
    const { res } = getMockRes();
    const next = jest.fn();

    middleware.dataErrors(error, {}, res, next);

    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith(expect.stringContaining('429'));
  });

  it('should pass through any 500s', () => {
    const error = new Problem(500);
    const next = jest.fn();

    middleware.dataErrors(error, {}, {}, next);

    expect(next).toBeCalledWith(error);
  });

  it('should pass through any Errors', () => {
    const error = new Error();
    const next = jest.fn();

    middleware.dataErrors(error, {}, {}, next);

    expect(next).toBeCalledWith(error);
  });
});
