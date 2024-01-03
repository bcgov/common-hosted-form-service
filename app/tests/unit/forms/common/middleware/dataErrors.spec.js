const Problem = require('api-problem');
const Objection = require('objection');

const middleware = require('../../../../../src/forms/common/middleware');

describe('test data errors middleware', () => {
  it('should handle an objection data error', () => {
    const error = new Objection.DataError({ nativeError: { message: 'This is a DataError' } });
    const next = jest.fn();

    middleware.dataErrors(error, {}, {}, next);

    expect(next).toBeCalledWith(expect.objectContaining({ status: 422 }));
  });

  it('should handle an objection not found error', () => {
    const error = new Objection.NotFoundError({ nativeError: { message: 'This is a NotFoundError' } });
    const next = jest.fn();

    middleware.dataErrors(error, {}, {}, next);

    expect(next).toBeCalledWith(expect.objectContaining({ status: 404 }));
  });

  it('should handle an objection validation error', () => {
    const error = new Objection.ValidationError({ nativeError: { message: 'This is a ValidationError' } });
    const next = jest.fn();

    middleware.dataErrors(error, {}, {}, next);

    expect(next).toBeCalledWith(expect.objectContaining({ status: 422 }));
  });

  it('should pass through any problem', () => {
    const error = new Problem(400);
    const next = jest.fn();

    middleware.dataErrors(error, {}, {}, next);

    expect(next).toBeCalledWith(expect.objectContaining({ status: 400 }));
  });
});
