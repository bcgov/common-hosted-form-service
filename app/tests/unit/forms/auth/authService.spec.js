const service = require('../../../../src/forms/auth/service');
const idpService = require('../../../../src/components/idpService');
const tenantService = require('../../../../src/components/tenantService');
const { UserFormAccess, FormGroup, Role, UserLoginHistory } = require('../../../../src/forms/common/models');
const { queryUtils } = require('../../../../src/forms/common/utils');

afterEach(() => {
  jest.clearAllMocks();
});

describe('parseToken', () => {
  it('returns a default object when an exception happens', async () => {
    const result = await idpService.parseToken(undefined);
    expect(result).toEqual({
      idpUserId: undefined,
      username: 'public',
      firstName: undefined,
      lastName: undefined,
      fullName: 'public',
      email: undefined,
      idp: 'public',
      public: true,
    });
  });
});

describe('formAccessToForm', () => {
  it('transforms the object', () => {
    const form = {
      formId: 1,
      formName: 2,
      formDescription: 3,
      labels: 4,
      idps: 5,
      active: 6,
      formVersionId: 7,
      version: 8,
      published: 9,
      versionUpdatedAt: 10,
      roles: 11,
      permissions: 12,
    };
    const result = service.formAccessToForm(form);
    expect(result).toEqual(form);
  });
});

describe('login', () => {
  const resultSample = {
    user: 'me',
    idpHint: 'fake',
  };

  it('returns a currentUser object', async () => {
    idpService.parseToken = jest.fn().mockReturnValue({ idp: 'fake' });
    idpService.findByIdp = jest.fn().mockReturnValue({ idp: 'fake', code: 'fake' });
    service.getUserId = jest.fn().mockReturnValue({ user: 'me' });
    const token = 'token';
    const result = await service.login(token);
    expect(idpService.parseToken).toBeCalledTimes(1);
    expect(idpService.parseToken).toBeCalledWith(token);
    expect(service.getUserId).toBeCalledTimes(1);
    expect(service.getUserId).toBeCalledWith({ idp: 'fake' });
    expect(result).toBeTruthy();
    expect(result).toEqual(expect.objectContaining(resultSample));
  });

  it('works with no params supplied', async () => {
    const token = 'token';
    const result = await service.login(token);
    expect(result).toEqual(expect.objectContaining(resultSample));
  });

  it('uses canonicalCode for usernameIdp when IDP has extra.canonicalCode', async () => {
    idpService.parseToken = jest.fn().mockReturnValue({ idp: 'azureidir' });
    idpService.findByIdp = jest.fn().mockReturnValue({ idp: 'azureidir', code: 'azureidir', extra: { canonicalCode: 'idir' } });
    idpService.findByCode = jest.fn().mockReturnValue({ idp: 'idir', code: 'idir', extra: { sortOrder: 10 } });
    service.getUserId = jest.fn().mockReturnValue({ username: 'testuser', idpCode: 'azureidir' });

    const result = await service.login('token');

    expect(result.usernameIdp).toEqual('testuser@idir');
    expect(result.idpHint).toEqual('idir');
  });

  it('uses code for usernameIdp when no canonicalCode', async () => {
    idpService.parseToken = jest.fn().mockReturnValue({ idp: 'idir' });
    idpService.findByIdp = jest.fn().mockReturnValue({ idp: 'idir', code: 'idir', extra: { sortOrder: 10 } });
    service.getUserId = jest.fn().mockReturnValue({ username: 'testuser', idpCode: 'idir' });

    const result = await service.login('token');

    expect(result.usernameIdp).toEqual('testuser@idir');
    expect(result.idpHint).toEqual('idir');
  });

  it('omits usernameIdp when user has no idpCode', async () => {
    idpService.parseToken = jest.fn().mockReturnValue({ idp: 'public' });
    idpService.findByIdp = jest.fn().mockReturnValue({ idp: 'public', code: 'public', extra: {} });
    service.getUserId = jest.fn().mockReturnValue({ username: 'public', idpCode: null });

    const result = await service.login('token');

    expect(result.usernameIdp).toEqual('public');
  });
});

describe('recordLoginHistory', () => {
  it('inserts a record for an authenticated user', async () => {
    const whereRawMock = jest.fn().mockResolvedValue({});
    const mergeMock = jest.fn().mockReturnValue({ whereRaw: whereRawMock });
    const onConflictMock = jest.fn().mockReturnValue({ merge: mergeMock });
    const insertMock = jest.fn().mockReturnValue({ onConflict: onConflictMock });
    jest.spyOn(UserLoginHistory, 'query').mockReturnValue({ insert: insertMock });

    await service.recordLoginHistory('user-uuid', 'idir');

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-uuid', idpCode: 'idir' }));
    expect(onConflictMock).toHaveBeenCalledWith(['userId', 'idpCode']);
    expect(mergeMock).toHaveBeenCalledWith(['lastLoginAt']);
  });

  it('skips insert for public idpCode', async () => {
    const querySpy = jest.spyOn(UserLoginHistory, 'query');

    await service.recordLoginHistory('user-uuid', 'public');

    expect(querySpy).not.toHaveBeenCalled();
  });

  it('does not throw when upsert fails', async () => {
    const insertMock = jest
      .fn()
      .mockReturnValue({ onConflict: jest.fn().mockReturnValue({ merge: jest.fn().mockReturnValue({ whereRaw: jest.fn().mockRejectedValue(new Error('db error')) }) }) });
    jest.spyOn(UserLoginHistory, 'query').mockReturnValue({ insert: insertMock });

    await expect(service.recordLoginHistory('user-uuid', 'idir')).resolves.not.toThrow();
  });
});

describe('getUserForms', () => {
  // Helper: creates a thenable query builder whose modify() returns itself
  const makeQueryObj = (resolvedItems) => {
    const queryObj = {
      modify: jest.fn().mockReturnThis(),
    };
    queryObj.then = (resolve, reject) => Promise.resolve(resolvedItems).then(resolve, reject);
    return queryObj;
  };

  it('personal path returns all forms without a whereNull filter', async () => {
    const userInfo = { id: 'user-1' };
    const items = [{ formId: 'personal-form', tenantId: null, idps: ['idir'], roles: [], permissions: [] }];

    jest.spyOn(queryUtils, 'defaultActiveOnly').mockReturnValue({ active: true });
    const queryObj = makeQueryObj(items);
    jest.spyOn(UserFormAccess, 'query').mockReturnValue(queryObj);
    jest.spyOn(Role, 'query').mockReturnValue({ withGraphFetched: jest.fn().mockResolvedValue([]) });
    const filterFormsSpy = jest.spyOn(service, 'filterForms').mockReturnValue(['personal-form']);

    const result = await service.getUserForms(userInfo, {});

    expect(queryObj.modify).toHaveBeenCalledWith('filterUserId', userInfo.id);
    expect(queryObj.modify).not.toHaveBeenCalledWith('whereNull', 'tenantId');
    expect(filterFormsSpy).toHaveBeenCalledWith(userInfo, items, undefined);
    expect(result).toEqual(['personal-form']);
  });

  it('personal path: tenanted form with IDIR IDP is included in query results when no tenant header', async () => {
    const userInfo = { id: 'user-1', idpHint: 'idir' };
    const items = [{ formId: 'tenanted-form', tenantId: 'tenant-1', idps: ['idir'], roles: [], permissions: [] }];

    jest.spyOn(queryUtils, 'defaultActiveOnly').mockReturnValue({ active: true });
    const queryObj = makeQueryObj(items);
    jest.spyOn(UserFormAccess, 'query').mockReturnValue(queryObj);
    jest.spyOn(Role, 'query').mockReturnValue({ withGraphFetched: jest.fn().mockResolvedValue([]) });
    const filterFormsSpy = jest.spyOn(service, 'filterForms').mockReturnValue(['tenanted-form']);

    // No headers — simulates submitter on /form/submit where x-tenant-id is stripped
    const result = await service.getUserForms(userInfo, { formId: 'tenanted-form' });

    expect(filterFormsSpy).toHaveBeenCalledWith(userInfo, items, undefined);
    expect(result).toEqual(['tenanted-form']);
  });

  it('personal path: tenanted group-only form is skipped gracefully when no headers (no throw, no tenant service call)', async () => {
    const userInfo = { id: 'user-1' };
    const items = [{ formId: 'group-form', tenantId: 'tenant-1', idps: [], roles: [], permissions: [] }];

    jest.spyOn(queryUtils, 'defaultActiveOnly').mockReturnValue({ active: true });
    const queryObj = makeQueryObj(items);
    jest.spyOn(UserFormAccess, 'query').mockReturnValue(queryObj);
    jest.spyOn(Role, 'query').mockReturnValue({ withGraphFetched: jest.fn().mockResolvedValue([]) });
    const tenantSpy = jest.spyOn(tenantService, 'getUserTenantGroupsAndRoles');
    jest.spyOn(service, 'filterForms').mockReturnValue([]);

    // Should not throw and should not attempt to fetch tenant groups
    await expect(service.getUserForms(userInfo, {})).resolves.toEqual([]);
    expect(tenantSpy).not.toHaveBeenCalled();
  });

  it('personal path: group-only form without formId param does not resolve tenant roles (list-all / My Forms case)', async () => {
    const userInfo = { id: 'user-1' };
    const headers = { authorization: 'Bearer token' };
    const items = [{ formId: 'group-form', tenantId: 'tenant-1', idps: [], roles: [], permissions: [] }];

    jest.spyOn(queryUtils, 'defaultActiveOnly').mockReturnValue({ active: true });
    const queryObj = makeQueryObj(items);
    jest.spyOn(UserFormAccess, 'query').mockReturnValue(queryObj);
    const tenantSpy = jest.spyOn(tenantService, 'getUserTenantGroupsAndRoles');
    jest.spyOn(service, 'filterForms').mockReturnValue([]);

    // No formId in params → list-all path (My Forms). Group-only forms must stay
    // unresolved so they are excluded outside of an actively selected tenant context.
    const result = await service.getUserForms(userInfo, {}, headers);

    expect(tenantSpy).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('personal path: group-only form WITH formId param resolves tenant roles via form own tenantId (single-form permission check)', async () => {
    const userInfo = { id: 'user-1' };
    const headers = { authorization: 'Bearer token' };
    const items = [{ formId: 'group-form', tenantId: 'tenant-1', idps: [], roles: [], permissions: [] }];

    jest.spyOn(queryUtils, 'defaultActiveOnly').mockReturnValue({ formId: 'group-form', active: true });
    const queryObj = makeQueryObj(items);
    jest.spyOn(UserFormAccess, 'query').mockReturnValue(queryObj);
    jest.spyOn(Role, 'query').mockReturnValue({
      withGraphFetched: jest.fn().mockResolvedValue([{ code: 'submission_reviewer', permissions: [{ code: 'submission_read' }] }]),
    });
    jest.spyOn(FormGroup, 'query').mockReturnValue({ modify: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]) });
    jest.spyOn(tenantService, 'getUserTenantGroupsAndRoles').mockResolvedValue([{ id: 'group-1', roles: ['submission_reviewer'] }]);
    jest.spyOn(service, 'filterForms').mockReturnValue(['group-form']);

    // formId in params → single-form permission check (e.g. hasFormPermissions on
    // /form/submit or /user/draft which never send x-tenant-id). Roles must be
    // resolved using the form's own tenantId so legitimate group members get access.
    const result = await service.getUserForms(userInfo, { formId: 'group-form' }, headers);

    expect(tenantService.getUserTenantGroupsAndRoles).toHaveBeenCalledWith({ currentUser: userInfo, headers }, 'tenant-1');
    expect(result).toEqual(['group-form']);
  });

  it('returns filtered tenant forms and enriches with tenant roles/permissions when headers are provided', async () => {
    const userInfo = { id: 'user-1', tenantId: 'tenant-1' };
    const headers = { authorization: 'Bearer token' };
    const params = { formId: 'form-1', accessLevels: ['team'] };
    const normalizedParams = { ...params, active: true };
    const items = [
      { formId: 'form-1', roles: [], permissions: [] },
      { formId: 'form-2', roles: [], permissions: [] },
    ];

    const defaultActiveSpy = jest.spyOn(queryUtils, 'defaultActiveOnly').mockReturnValue(normalizedParams);

    const queryObj = {
      modify: jest.fn((name) => {
        if (name === 'filterTenantId') return Promise.resolve(items);
        return queryObj;
      }),
    };
    const querySpy = jest.spyOn(UserFormAccess, 'query').mockReturnValue(queryObj);

    const formGroupQueryObj = { modify: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]) };
    jest.spyOn(FormGroup, 'query').mockReturnValue(formGroupQueryObj);

    const userGroupsSpy = jest.spyOn(tenantService, 'getUserTenantGroupsAndRoles').mockResolvedValue([{ id: 'group-1', roles: ['form_admin'] }]);
    jest.spyOn(Role, 'query').mockReturnValue({
      withGraphFetched: jest.fn().mockResolvedValue([
        {
          code: 'form_admin',
          permissions: [{ code: 'form_read' }],
        },
      ]),
    });

    const filterFormsSpy = jest.spyOn(service, 'filterForms').mockReturnValue(['filtered']);

    const result = await service.getUserForms(userInfo, params, headers);

    expect(defaultActiveSpy).toHaveBeenCalledWith(params);
    expect(querySpy).toHaveBeenCalledTimes(1);
    expect(queryObj.modify).toHaveBeenNthCalledWith(1, 'filterUserId', userInfo.id);
    expect(queryObj.modify).toHaveBeenNthCalledWith(2, 'filterFormId', normalizedParams.formId);
    expect(queryObj.modify).toHaveBeenNthCalledWith(3, 'filterActive', normalizedParams.active);
    expect(queryObj.modify).toHaveBeenNthCalledWith(4, 'filterTenantId', userInfo.tenantId);

    expect(userGroupsSpy).toHaveBeenCalledTimes(1);
    expect(userGroupsSpy).toHaveBeenCalledWith({ currentUser: userInfo, headers }, userInfo.tenantId);
    expect(items[0]).toMatchObject({ roles: ['form_admin'], permissions: ['form_read'] });
    expect(items[1]).toMatchObject({ roles: ['form_admin'], permissions: ['form_read'] });

    expect(filterFormsSpy).toHaveBeenCalledWith(userInfo, items, normalizedParams.accessLevels);
    expect(result).toEqual(['filtered']);
  });
});
