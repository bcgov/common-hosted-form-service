const service = require('../../../../src/forms/rbac/service');
const authService = require('../../../../src/forms/auth/service');
const { UserFormAccess } = require('~/forms/common/models');
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

describe('isUserPartOfFormTeams', () => {
  let modifyMock;

  const params = {
    formId: '3d338420-b272-4b4b-8b08-756ed5b1576c',
    email: 'test@gg.com',
    roles: '*',
    active: true,
  };

  beforeEach(() => {
    modifyMock = jest.fn().mockReturnThis();

    UserFormAccess.query = jest.fn().mockReturnValue({
      modify: modifyMock,
      then: (cb) => cb([]), // We'll override this in each test if needed
    });
  });

  it('should return true if user exists as a form member', async () => {
    const fakeFormMember = [
      {
        userId: 'b7e2c5f3-0e77-4dc3-9a6e-d20bbdaf31c8',
        idpUserId: 'A1F47C98E5B1447D91C8EAB6237D0F2B',
        username: 'AXIWODY',
        fullName: 'XT:Bob, Barb X WLRS:IN',
        firstName: 'Bob',
        lastName: 'Barb',
        email: 'test@gg.com',
        formId: 'e9b75a12-4f3a-4f97-a6b3-39d82c7e91f4',
        formName: 'CanShareDraft',
        labels: [],
        user_idpCode: 'idir',
        identityProviders: [],
        form_login_required: [],
        idps: [],
        active: true,
        formVersionId: 'f4a9d3c1-8e6b-4e5a-91d7-3c8e0b2fa781',
        version: 1,
        roles: ['form_submitter'],
        permissions: ['document_template_read', 'form_read', 'submission_create'],
        published: true,
        versionUpdatedAt: '2025-03-24T00:46:26.895Z',
        formDescription: '',
      },
    ];

    UserFormAccess.query = jest.fn(() => ({
      modify: modifyMock,
      then: (cb) => cb(fakeFormMember),
    }));

    // Simulate `.query().modify().then(...)` chain
    const result = await service.isUserPartOfFormTeams(params);
    expect(result).toBe(true);
    expect(UserFormAccess.query).toHaveBeenCalled();
    expect(modifyMock).toHaveBeenCalledWith('filterEmail', params.email);
    expect(modifyMock).toHaveBeenCalledWith('filterFormId', params.formId);
    expect(modifyMock).toHaveBeenCalledWith('filterByAccess', params.idps, params.roles, params.permissions);
    expect(modifyMock).toHaveBeenCalledWith('orderDefault');
  });

  it('should return false if user does not exist as a form member', async () => {
    //const fakeFormMember = [];

    UserFormAccess.query = jest.fn(() => ({
      modify: modifyMock,
      then: (cb) => cb([]),
    }));

    // Simulate `.query().modify().then(...)` chain
    const result = await service.isUserPartOfFormTeams(params);
    expect(result).toBe(false);
    expect(UserFormAccess.query).toHaveBeenCalled();
    expect(modifyMock).toHaveBeenCalledWith('filterEmail', params.email);
    expect(modifyMock).toHaveBeenCalledWith('filterFormId', params.formId);
    expect(modifyMock).toHaveBeenCalledWith('filterByAccess', params.idps, params.roles, params.permissions);
    expect(modifyMock).toHaveBeenCalledWith('orderDefault');
  });
});
