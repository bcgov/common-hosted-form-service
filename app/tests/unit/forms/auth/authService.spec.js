const service = require('../../../../src/forms/auth/service');
const idpService = require('../../../../src/components/idpService');
const cacheService = require('../../../../src/components/cacheService');

cacheService.getLoginUser = jest.fn().mockResolvedValueOnce();
cacheService.setLoginUser = jest.fn().mockResolvedValueOnce();

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
  const resultSample = { idpUserId: 'test', user: 'me', idpHint: 'fake' };

  it('returns a currentUser object', async () => {
    idpService.parseToken = jest.fn().mockReturnValue({ idpUserId: 'test', idp: 'fake' });
    idpService.findByIdp = jest.fn().mockReturnValue({ idp: 'fake', code: 'fake' });
    service.getUserId = jest.fn().mockReturnValue({ idpUserId: 'test', user: 'me' });
    const token = 'token';
    const result = await service.login(token);
    expect(idpService.parseToken).toBeCalledTimes(1);
    expect(idpService.parseToken).toBeCalledWith(token);
    expect(service.getUserId).toBeCalledTimes(1);
    expect(service.getUserId).toBeCalledWith({ idpUserId: 'test', idp: 'fake' });
    expect(result).toBeTruthy();
    expect(result).toEqual(resultSample);
  });

  it('works with no params supplied', async () => {
    const token = 'token';
    const result = await service.login(token);
    expect(result).toEqual(resultSample);
  });
});
