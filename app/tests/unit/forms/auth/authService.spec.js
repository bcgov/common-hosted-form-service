const service = require('../../../../src/forms/auth/service');
const idpService = require('../../../../src/components/idpService');
const tenantService = require('../../../../src/components/tenantService');
const { UserFormAccess, FormGroup, Role } = require('../../../../src/forms/common/models');
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
    expect(result).toEqual(resultSample);
  });

  it('works with no params supplied', async () => {
    const token = 'token';
    const result = await service.login(token);
    expect(result).toEqual(resultSample);
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

  it('personal path: tenanted group-only form populates tenant roles when headers are present', async () => {
    const userInfo = { id: 'user-1' };
    const headers = { authorization: 'Bearer token' };
    const items = [{ formId: 'group-form', tenantId: 'tenant-1', idps: [], roles: [], permissions: [] }];

    jest.spyOn(queryUtils, 'defaultActiveOnly').mockReturnValue({ active: true });
    const queryObj = makeQueryObj(items);
    jest.spyOn(UserFormAccess, 'query').mockReturnValue(queryObj);
    jest.spyOn(Role, 'query').mockReturnValue({
      withGraphFetched: jest.fn().mockResolvedValue([{ code: 'submission_reviewer', permissions: [{ code: 'submission_read' }] }]),
    });
    jest.spyOn(FormGroup, 'query').mockReturnValue({ modify: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]) });
    jest.spyOn(tenantService, 'getUserTenantGroupsAndRoles').mockResolvedValue([{ id: 'group-1', roles: ['submission_reviewer'] }]);
    jest.spyOn(service, 'filterForms').mockReturnValue(['group-form']);

    const result = await service.getUserForms(userInfo, {}, headers);

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
