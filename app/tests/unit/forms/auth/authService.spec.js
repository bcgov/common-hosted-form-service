const service = require('../../../../src/forms/auth/service');

afterEach(() => {
  jest.clearAllMocks();
});

describe('parseToken', () => {
  it('returns a default object when an exception happens', () => {
    const result = service.parseToken(undefined);
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
  };

  it('returns a currentUser object', async () => {
    service.parseToken = jest.fn().mockReturnValue('userInf');
    service.getUserId = jest.fn().mockReturnValue({ user: 'me' });
    const token = 'token';
    const result = await service.login(token);
    expect(service.parseToken).toHaveBeenCalledTimes(1);
    expect(service.parseToken).toHaveBeenCalledWith(token);
    expect(service.getUserId).toHaveBeenCalledTimes(1);
    expect(service.getUserId).toHaveBeenCalledWith('userInf');
    expect(result).toBeTruthy();
    expect(result).toEqual(resultSample);
  });

  it('works with no params supplied', async () => {
    const token = 'token';
    const result = await service.login(token);
    expect(result).toEqual(resultSample);
  });
});
