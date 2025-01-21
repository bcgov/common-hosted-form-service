const service = require('../../../../src/forms/rbac/service');
const authService = require('../../../../src/forms/auth/service');

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getCurrentUser', () => {
  it('should return a current user', async () => {
    const userInfo = {
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
    const result = await service.getCurrentUser(userInfo);
    expect(result).toBeTruthy();
    expect(result).toMatchObject(userInfo);
  });

  it('should return an empty object', async () => {
    const userInfo = undefined;
    const result = await service.getCurrentUser(userInfo);
    expect(result).toBeTruthy();
    expect(result).toMatchObject({});
  });
});

describe('getCurrentUserForms', () => {
  it('should return empty list without currentUser', async () => {
    const userInfo = undefined;
    const result = await service.getCurrentUserForms(userInfo);
    expect(result).toBeTruthy();
    expect(result).toMatchObject([]);
  });
  it('should return empty list with invalid currentUser', async () => {
    const userInfo = { msg: 'no valid currentUser attributes' };
    const result = await service.getCurrentUserForms(userInfo);
    expect(result).toBeTruthy();
    expect(result).toMatchObject([]);
  });
  it('should use public access level for public user', async () => {
    authService.getUserForms = jest.fn().mockResolvedValueOnce([]);
    authService.filterForms = jest.fn().mockResolvedValueOnce([]);
    const userInfo = { public: true };
    const result = await service.getCurrentUserForms(userInfo);
    expect(result).toBeTruthy();
    expect(result).toMatchObject([]);
    expect(authService.getUserForms).toBeCalledWith(userInfo, { active: true }); // current user, no params (always active)
    expect(authService.filterForms).toBeCalledWith(userInfo, [], ['public']); // current user, forms, public access level
  });
  it('should use public access level for public param', async () => {
    authService.getUserForms = jest.fn().mockResolvedValueOnce([]);
    authService.filterForms = jest.fn().mockResolvedValueOnce([]);
    const userInfo = { public: false };
    const params = { public: true };
    const result = await service.getCurrentUserForms(userInfo, params);
    expect(result).toBeTruthy();
    expect(result).toMatchObject([]);
    expect(authService.getUserForms).toBeCalledWith(userInfo, { ...params, active: true }); // current user, params + active
    expect(authService.filterForms).toBeCalledWith(userInfo, [], ['public']); // current user, forms, public access level
  });
  it('should use idp access level for idp param', async () => {
    authService.getUserForms = jest.fn().mockResolvedValueOnce([]);
    authService.filterForms = jest.fn().mockResolvedValueOnce([]);
    const userInfo = { public: false };
    const params = { idp: true };
    const result = await service.getCurrentUserForms(userInfo, params);
    expect(result).toBeTruthy();
    expect(result).toMatchObject([]);
    expect(authService.getUserForms).toBeCalledWith(userInfo, { ...params, active: true }); // current user, params + active
    expect(authService.filterForms).toBeCalledWith(userInfo, [], ['idp']); // current user, forms, idp access level
  });
  it('should use team access level for team param', async () => {
    authService.getUserForms = jest.fn().mockResolvedValueOnce([]);
    authService.filterForms = jest.fn().mockResolvedValueOnce([]);
    const userInfo = { public: false };
    const params = { team: true };
    const result = await service.getCurrentUserForms(userInfo, params);
    expect(result).toBeTruthy();
    expect(result).toMatchObject([]);
    expect(authService.getUserForms).toBeCalledWith(userInfo, { ...params, active: true }); // current user, params + active
    expect(authService.filterForms).toBeCalledWith(userInfo, [], ['team']); // current user, forms, team access level
  });
  it('should use no access level with invalid params', async () => {
    authService.getUserForms = jest.fn().mockResolvedValueOnce([]);
    authService.filterForms = jest.fn().mockResolvedValueOnce([]);
    const userInfo = { public: false };
    const params = { bogus: true };
    const result = await service.getCurrentUserForms(userInfo, params);
    expect(result).toBeTruthy();
    expect(result).toMatchObject([]);
    expect(authService.getUserForms).toBeCalledWith(userInfo, { ...params, active: true }); // current user, params + active
    expect(authService.filterForms).toBeCalledWith(userInfo, [], []); // current user, forms, no access level filters
  });
});
