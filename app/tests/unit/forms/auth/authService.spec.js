const service = require('../../../../src/forms/auth/service');

afterEach(() => {
  jest.clearAllMocks();
});

describe('parseToken', () => {

  it('returns a default object when an exception happens', () => {
    const result = service.parseToken(undefined);
    expect(result).toEqual({
      keycloakId: undefined,
      username: 'public',
      firstName: undefined,
      lastName: undefined,
      fullName: 'public',
      email: undefined,
      idp: 'public',
      public: true
    });
  });
});

describe('formAccessToForm', () => {
  it('transforms the object', () => {
    const result = service.formAccessToForm({
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
      permissions: 12
    });
    expect(result).toEqual({
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
      permissions: 12
    });
  });
});

describe('login', () => {

  it('returns a currentUser object', async () => {
    service.parseToken = jest.fn().mockReturnValue('userInf');
    service.getUserId = jest.fn().mockReturnValue({ user: 'me' });
    service.getUserForms = jest.fn().mockReturnValue([{ formID: 1 }, { formId: 2 }]);
    const params = { p: 1 };
    const token = 'token';
    const result = await service.login(token, params);
    expect(service.parseToken).toHaveBeenCalledTimes(1);
    expect(service.parseToken).toHaveBeenCalledWith(token);
    expect(service.getUserId).toHaveBeenCalledTimes(1);
    expect(service.getUserId).toHaveBeenCalledWith('userInf');
    expect(service.getUserForms).toHaveBeenCalledTimes(2);
    expect(service.getUserForms).toHaveBeenCalledWith({ user: 'me' }, { p: 1, active: false });
    expect(result).toBeTruthy();
    expect(result).toEqual({ user: 'me', forms: [{ formID: 1 }, { formId: 2 }], deletedForms: [{ formID: 1 }, { formId: 2 }] });
  });

  it('works with no params supplied', async () => {
    const token = 'token';
    const result = await service.login(token);
    expect(result).toEqual({ user: 'me', forms: [{ formID: 1 }, { formId: 2 }], deletedForms: [{ formID: 1 }, { formId: 2 }] });
  });
});
