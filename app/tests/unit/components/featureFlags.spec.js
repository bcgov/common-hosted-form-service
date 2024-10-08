const { getMockReq, getMockRes } = require('@jest-mock/express');
const { featureFlags, FEATURES } = require('../../../src/components/featureFlags');

beforeEach(() => {});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('featureFlags', () => {
  const assertService = (srv) => {
    expect(srv).toBeTruthy();
  };

  it('should return a service', () => {
    assertService(featureFlags);
  });
});

describe('enabled', () => {
  it('should return true if feature enabled', () => {
    const result = featureFlags.enabled(FEATURES.EVENT_STREAM_SERVICE);
    expect(result).toBeTruthy();
  });

  it('should return false if feature not exist', () => {
    const result = featureFlags.enabled('badbad');
    expect(result).toBeFalsy();
  });
});

describe('featureEnabled', () => {
  it('should pass middleware featureEnabled when feature enabled', async () => {
    const req = getMockReq();
    const { res, next } = getMockRes();

    const middleware = featureFlags.featureEnabled(FEATURES.EVENT_STREAM_SERVICE);

    await middleware(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });

  it('should fail middleware featureEnabled when feature not enabled', async () => {
    const req = getMockReq();
    const { res, next } = getMockRes();

    const middleware = featureFlags.featureEnabled('badbad');

    await middleware(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 400 }));
  });
});

describe('eventStreamService', () => {
  it('should return true for eventStreamServiceEnabled', () => {
    expect(featureFlags.eventStreamService).toBeTruthy();
  });
});

describe('eventStreamServiceEnabled', () => {
  it('should pass middleware eventStreamServiceEnabled when feature enabled', async () => {
    const req = getMockReq();
    const { res, next } = getMockRes();

    const middleware = featureFlags.eventStreamServiceEnabled();

    await middleware(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });

  it('should fail middleware eventStreamServiceEnabled when feature not enabled', async () => {
    featureFlags.enabled = jest.fn().mockReturnValue(false);
    const req = getMockReq();
    const { res, next } = getMockRes();

    const middleware = featureFlags.eventStreamServiceEnabled();

    await middleware(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 400 }));
  });
});
