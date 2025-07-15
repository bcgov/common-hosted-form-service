const errorToProblem = require('../../../src/components/errorToProblem');

const SERVICE = 'TESTSERVICE';

describe('errorToProblem', () => {
  it('should throw a 404', () => {
    const error = {
      response: {
        data: { detail: 'detail' },
        status: 404,
      },
    };

    expect(() => errorToProblem(SERVICE, error)).toThrow('404');
  });

  it('should throw a 422', () => {
    const error = {
      response: {
        data: { detail: 'detail' },
        status: 422,
      },
    };

    expect(() => errorToProblem(SERVICE, error)).toThrow('422');
  });

  it('should throw a 502', () => {
    const error = {
      message: 'msg',
    };

    expect(() => errorToProblem(SERVICE, error)).toThrow('502');
  });
});
