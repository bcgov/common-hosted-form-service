const service = require('../../../../src/forms/auth/service');
const idpService = require('../../../../src/components/idpService');

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

  it('uses canonicalCode for usernameIdp when IDP has extra.canonicalCode', async () => {
    idpService.parseToken = jest.fn().mockReturnValue({ idp: 'azureidir' });
    idpService.findByIdp = jest.fn().mockReturnValue({ idp: 'azureidir', code: 'azureidir', extra: { canonicalCode: 'idir' } });
    service.getUserId = jest.fn().mockReturnValue({ username: 'testuser', idpCode: 'azureidir' });

    const result = await service.login('token');

    expect(result.usernameIdp).toEqual('testuser@idir');
    expect(result.idpHint).toEqual('azureidir');
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
