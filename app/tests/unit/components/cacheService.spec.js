const { MockModel } = require('../../common/dbHelper');
const cacheService = require('../../../src/components/cacheService');

beforeEach(() => {
  MockModel.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('cacheService', () => {
  beforeEach(async () => {
    MockModel.mockReset();
    await cacheService.clear();
  });

  const assertService = (srv) => {
    expect(srv).toBeTruthy();
  };

  it('should return a service', () => {
    assertService(cacheService);
  });

  it('should cache a loginUser', async () => {
    const userInfo = { idpUserId: 'idpUserId', hash: '1' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com', hash: '1' };

    await cacheService.setLoginUser(userInfo, loginUser);
    const result = await cacheService.getLoginUser(userInfo);

    expect(result).toBeTruthy();
    expect(result).toMatchObject(loginUser);
  });

  it('should not get a loginUser without idpUserId', async () => {
    const userInfo = { idpUserId: 'idpUserId', hash: '1' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com', hash: '1' };

    let cached = await cacheService.setLoginUser(userInfo, loginUser);
    expect(cached).toBeTruthy();

    delete userInfo.idpUserId;
    cached = await cacheService.getLoginUser(userInfo);
    expect(cached).toBeFalsy();
  });

  it('should not get a loginUser without hash', async () => {
    const userInfo = { idpUserId: 'idpUserId', hash: '1' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com', hash: '1' };

    let cached = await cacheService.setLoginUser(userInfo, loginUser);
    expect(cached).toBeTruthy();

    delete userInfo.hash;
    cached = await cacheService.getLoginUser(userInfo);
    expect(cached).toBeFalsy();
  });

  it('should not cache a loginUser without idpUserId', async () => {
    const userInfo = { hash: '1' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com', hash: '1' };

    const result = await cacheService.setLoginUser(userInfo, loginUser);
    expect(result).toBeFalsy();
  });

  it('should not cache a loginUser without hash', async () => {
    const userInfo = { idpUserId: 'idpUserId' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com', hash: '1' };

    const result = await cacheService.setLoginUser(userInfo, loginUser);
    expect(result).toBeFalsy();
  });

  it('should clear a loginUser when time to live expires', async () => {
    const userInfo = { idpUserId: 'idpUserId', hash: '1' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com', hash: '1' };

    const ttl = 1000; // 1 second

    await cacheService.setLoginUser(userInfo, loginUser, ttl);
    let cached = await cacheService.getLoginUser(userInfo);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(loginUser);

    await new Promise((r) => setTimeout(r, ttl));

    cached = await cacheService.getLoginUser(userInfo);

    expect(cached).toBeFalsy();
  });

  it('should not return a loginUser when hash changes', async () => {
    const userInfo = { idpUserId: 'idpUserId', hash: '1' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com', hash: '1' };

    await cacheService.setLoginUser(userInfo, loginUser);
    let cached = await cacheService.getLoginUser(userInfo);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(loginUser);

    userInfo.hash = '2';
    cached = await cacheService.getLoginUser(userInfo);

    expect(cached).toBeFalsy();
  });

  it('should clear cache', async () => {
    // add login user to cache
    const userInfo = { idpUserId: 'idpUserId', hash: '1' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com', hash: '1' };

    await cacheService.setLoginUser(userInfo, loginUser);
    let cached = await cacheService.getLoginUser(userInfo);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(loginUser);

    // clear cache and nothing is left
    await cacheService.clear();

    cached = await cacheService.getLoginUser(userInfo);
    expect(cached).toBeFalsy();
  });
});
