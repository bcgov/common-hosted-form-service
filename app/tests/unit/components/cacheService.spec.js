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

  it('should cache a login user', async () => {
    const userInfo = { idpUserId: 'idpUserId' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com' };

    await cacheService.setLoginUser(userInfo, loginUser);
    const result = await cacheService.getLoginUser(userInfo);

    expect(result).toBeTruthy();
    expect(result).toMatchObject(loginUser);
  });

  it('should cache a current user', async () => {
    const currentUser = { id: 'id' };
    const params = {};
    const user = { id: 'id', forms: [] };

    await cacheService.setCurrentUser(currentUser, params, user);
    const result = await cacheService.getCurrentUser(currentUser, params);

    expect(result).toBeTruthy();
    expect(result).toMatchObject(user);
  });

  it('should not cache a public login user', async () => {
    const publicUserInfo = {
      idpUserId: undefined,
      keycloakId: undefined,
      username: 'public',
      firstName: undefined,
      lastName: undefined,
      fullName: 'public',
      email: undefined,
      idp: 'public',
      public: true,
    };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com' };

    await cacheService.setLoginUser(publicUserInfo, loginUser);
    const result = await cacheService.getLoginUser(publicUserInfo);

    expect(result).toBeFalsy();
  });

  it('should not cache a public current user', async () => {
    const publicCurrentUser = { id: 'id', public: true };
    const params = {};
    const user = { id: 'id', public: true, forms: [] };

    await cacheService.setCurrentUser(publicCurrentUser, params, user);
    const result = await cacheService.getCurrentUser(publicCurrentUser, params);

    expect(result).toBeFalsy();
  });

  it('should cache a current user with different forms', async () => {
    const currentUser = { id: 'id' };
    const paramsA = { count: 1 };
    const paramsB = { count: 2 };
    const userA = { id: 'id', forms: [{}] };
    const userB = { id: 'id', forms: [{}, {}] };

    await cacheService.setCurrentUser(currentUser, paramsA, userA);
    await cacheService.setCurrentUser(currentUser, paramsB, userB);
    const resultA = await cacheService.getCurrentUser(currentUser, paramsA);
    const resultB = await cacheService.getCurrentUser(currentUser, paramsB);

    expect(resultA).toBeTruthy();
    expect(resultB).toBeTruthy();
    expect(resultA).toMatchObject(userA);
    expect(resultB).toMatchObject(userB);
  });

  it('should cache a current user using default params', async () => {
    const currentUser = { id: 'id' };
    const params = undefined;
    const user = { id: 'id', forms: [] };

    await cacheService.setCurrentUser(currentUser, params, user);
    const result = await cacheService.getCurrentUser(currentUser);

    expect(result).toBeTruthy();
    expect(result).toMatchObject(user);
  });

  it('should clear a current user', async () => {
    const currentUser = { id: 'id' };
    const params = {};
    const user = { id: 'id', forms: [] };

    await cacheService.setCurrentUser(currentUser, params, user);
    let cached = await cacheService.getCurrentUser(currentUser, params);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(user);

    await cacheService.clearCurrentUser(currentUser);
    cached = await cacheService.getCurrentUser(currentUser, params);

    expect(cached).toBeFalsy();
  });

  it('should clear a current user when time to live expires', async () => {
    const currentUser = { id: 'id' };
    const params = {};
    const user = { id: 'id', forms: [] };
    const ttl = 1000; // 1 second

    await cacheService.setCurrentUser(currentUser, params, user, ttl);
    let cached = await cacheService.getCurrentUser(currentUser, params);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(user);

    await new Promise((r) => setTimeout(r, ttl));

    cached = await cacheService.getCurrentUser(currentUser, params);
    expect(cached).toBeFalsy();
  });

  it('should clear multiple current users', async () => {
    const currentUser = { id: 'id' };
    const params = {};
    const user = { id: 'id', forms: [] };

    const currentUserA = { id: 'A' };
    const paramsA = {};
    const userA = { id: 'A', forms: [] };

    const currentUserB = { id: 'B' };
    const paramsB = {};
    const userB = { id: 'B', forms: [] };

    await cacheService.setCurrentUser(currentUser, params, user);
    let cached = await cacheService.getCurrentUser(currentUser, params);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(user);

    await cacheService.setCurrentUser(currentUserA, paramsA, userA);
    cached = await cacheService.getCurrentUser(currentUserA, paramsA);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(userA);

    await cacheService.setCurrentUser(currentUserB, paramsB, userB);
    cached = await cacheService.getCurrentUser(currentUserB, paramsB);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(userB);

    // pass in A and B ids to clear those from the cache
    // currentUser will be ignored because it is not a string/key
    const ids = [currentUser, 'A', 'B'];
    await cacheService.clearCurrentUsersById(ids);

    // should leave currentUser in place, but A and B are gone
    cached = await cacheService.getCurrentUser(currentUser, params);
    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(user);

    cached = await cacheService.getCurrentUser(currentUserA, paramsA);
    expect(cached).toBeFalsy();

    cached = await cacheService.getCurrentUser(currentUserB, paramsB);
    expect(cached).toBeFalsy();
  });

  it('should clear cache', async () => {
    const currentUser = { id: 'id' };
    const params = {};
    const user = { id: 'id', forms: [] };

    const currentUserA = { id: 'A' };
    const paramsA = {};
    const userA = { id: 'A', forms: [] };

    const currentUserB = { id: 'B' };
    const paramsB = {};
    const userB = { id: 'B', forms: [] };

    await cacheService.setCurrentUser(currentUser, params, user);
    let cached = await cacheService.getCurrentUser(currentUser, params);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(user);

    await cacheService.setCurrentUser(currentUserA, paramsA, userA);
    cached = await cacheService.getCurrentUser(currentUserA, paramsA);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(userA);

    await cacheService.setCurrentUser(currentUserB, paramsB, userB);
    cached = await cacheService.getCurrentUser(currentUserB, paramsB);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(userB);

    // add login user to cache
    const userInfo = { idpUserId: 'idpUserId' };
    const loginUser = { idpUserId: 'idpUserId', email: 'email@mail.com' };

    await cacheService.setLoginUser(userInfo, loginUser);
    cached = await cacheService.getLoginUser(userInfo);

    expect(cached).toBeTruthy();
    expect(cached).toMatchObject(loginUser);

    // clear cache and nothing is left
    await cacheService.clear();

    cached = await cacheService.getCurrentUser(currentUser, params);
    expect(cached).toBeFalsy();

    cached = await cacheService.getCurrentUser(currentUserA, paramsA);
    expect(cached).toBeFalsy();

    cached = await cacheService.getCurrentUser(currentUserB, paramsB);
    expect(cached).toBeFalsy();

    // login users cleared too...
    cached = await cacheService.getLoginUser(userInfo);
    expect(cached).toBeFalsy();
  });
});
