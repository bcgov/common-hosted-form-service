const mockLogError = jest.fn();
jest.mock('../../../src/components/log', () => () => ({ error: mockLogError }));

const errorToProblem = require('../../../src/components/errorToProblem');

const SERVICE = 'TESTSERVICE';

beforeEach(() => {
  mockLogError.mockReset();
});

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

describe('errorToProblem sanitization', () => {
  it('does not log the bulky axios config/request/response objects', () => {
    const error = {
      message: 'Request failed with status code 500',
      code: 'ERR_BAD_RESPONSE',
      stack: 'Error: boom\n  at somewhere',
      config: { method: 'post', url: 'http://cdogs/api/v2/template/render', data: Buffer.alloc(50000) },
      request: { _huge: 'x'.repeat(50000) },
      response: { status: 500, statusText: 'Internal Server Error', data: Buffer.from([0, 1, 2, 3]) },
    };

    expect(() => errorToProblem(SERVICE, error)).toThrow('500');

    expect(mockLogError).toHaveBeenCalledTimes(1);
    const [message, meta] = mockLogError.mock.calls[0];
    // The bulky objects must not be present in the log metadata.
    expect(meta).not.toHaveProperty('config');
    expect(meta).not.toHaveProperty('request');
    expect(meta).not.toHaveProperty('response');
    // Only useful scalars are kept.
    expect(meta).toMatchObject({
      message: 'Request failed with status code 500',
      code: 'ERR_BAD_RESPONSE',
      method: 'post',
      url: 'http://cdogs/api/v2/template/render',
      status: 500,
      statusText: 'Internal Server Error',
    });
    // The message must summarize binary rather than dumping the bytes.
    expect(message).toContain('<binary 4 bytes>');
  });

  it('summarizes a binary response body in the thrown detail', () => {
    expect.assertions(1);
    const error = {
      response: { status: 500, data: Buffer.from([10, 20, 30]) },
    };

    try {
      errorToProblem(SERVICE, error);
    } catch (e) {
      expect(e.detail).toBe('<binary 3 bytes>');
    }
  });

  it('stringifies an object response body instead of "[object Object]"', () => {
    expect.assertions(1);
    const error = {
      response: { status: 500, data: { detail: 'boom', errors: ['x'] } },
    };

    try {
      errorToProblem(SERVICE, error);
    } catch (e) {
      expect(e.detail).toBe('{"detail":"boom","errors":["x"]}');
    }
  });

  it('truncates an oversized response body in the thrown detail', () => {
    expect.assertions(2);
    const error = {
      response: { status: 500, data: 'y'.repeat(5000) },
    };

    try {
      errorToProblem(SERVICE, error);
    } catch (e) {
      expect(e.detail.length).toBeLessThan(5000);
      expect(e.detail).toContain('truncated');
    }
  });
});
