const service = require('../../../../src/forms/rbac/service');
const authService = require('../../../../src/forms/auth/service');
const { FormMigrationLog } = require('../../../../src/forms/common/models');

jest.mock('~/forms/common/models');

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

describe('_markMigratedForms', () => {
  it('flags only the forms that have a migration record', async () => {
    // Inside a tenant's list every form is group-controlled, so "uses groups" is true of
    // every row. Whether it was migrated is the part that actually varies.
    FormMigrationLog.query = jest.fn().mockReturnValue({
      whereIn: jest.fn().mockReturnValue({
        distinct: jest.fn().mockResolvedValue([{ formId: 'migrated-form' }]),
      }),
    });

    const result = await service._markMigratedForms([
      { formId: 'migrated-form', tenantId: 'tenant-1' },
      { formId: 'native-form', tenantId: 'tenant-1' },
    ]);

    expect(result.find((f) => f.formId === 'migrated-form').migrated).toBe(true);
    expect(result.find((f) => f.formId === 'native-form').migrated).toBe(false);
  });

  it('skips the lookup entirely when no form is tenanted', async () => {
    FormMigrationLog.query = jest.fn();

    const result = await service._markMigratedForms([{ formId: 'personal-form', tenantId: null }]);

    expect(FormMigrationLog.query).not.toHaveBeenCalled();
    expect(result[0].migrated).toBe(false);
  });

  it('uses a single query for the whole page rather than one per form', async () => {
    const whereIn = jest.fn().mockReturnValue({ distinct: jest.fn().mockResolvedValue([]) });
    FormMigrationLog.query = jest.fn().mockReturnValue({ whereIn });

    await service._markMigratedForms([
      { formId: 'a', tenantId: 't' },
      { formId: 'b', tenantId: 't' },
      { formId: 'c', tenantId: 't' },
    ]);

    expect(FormMigrationLog.query).toHaveBeenCalledTimes(1);
    expect(whereIn).toHaveBeenCalledWith('formId', ['a', 'b', 'c']);
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
    expect(authService.getUserForms).toBeCalledWith(userInfo, { active: true }, null); // current user, no params (always active), no headers
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
    expect(authService.getUserForms).toBeCalledWith(userInfo, { ...params, active: true }, null); // current user, params + active, no headers
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
    expect(authService.getUserForms).toBeCalledWith(userInfo, { ...params, active: true }, null); // current user, params + active, no headers
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
    expect(authService.getUserForms).toBeCalledWith(userInfo, { ...params, active: true }, null); // current user, params + active, no headers
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
    expect(authService.getUserForms).toBeCalledWith(userInfo, { ...params, active: true }, null); // current user, params + active, no headers
    expect(authService.filterForms).toBeCalledWith(userInfo, [], []); // current user, forms, no access level filters
  });

  it('should pass headers through to authService.getUserForms when provided', async () => {
    authService.getUserForms = jest.fn().mockResolvedValueOnce([]);
    authService.filterForms = jest.fn().mockResolvedValueOnce([]);
    const userInfo = { public: false };
    const params = { team: true };
    const headers = { authorization: 'Bearer token' };

    const result = await service.getCurrentUserForms(userInfo, params, headers);

    expect(result).toBeTruthy();
    expect(result).toMatchObject([]);
    expect(authService.getUserForms).toBeCalledWith(userInfo, { ...params, active: true }, headers);
    expect(authService.filterForms).toBeCalledWith(userInfo, [], ['team']);
  });
});
