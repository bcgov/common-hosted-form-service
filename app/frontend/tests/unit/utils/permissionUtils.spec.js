import { formService } from '@/services';
import store from '@/store';
import { FormPermissions, IdentityProviders, IdentityMode } from '@/utils/constants';
import * as permissionUtils from '@/utils/permissionUtils';

describe('checkFormSubmit', () => {
  it('should be false when userForm is undefined', () => {
    expect(permissionUtils.checkFormSubmit(undefined)).toBeFalsy();
  });

  it('should be false when idps is undefined', () => {
    expect(permissionUtils.checkFormSubmit({ permissions: [] })).toBeFalsy();
  });

  it('should be false when permissions is undefined', () => {
    expect(permissionUtils.checkFormSubmit({ idps: [] })).toBeFalsy();
  });

  it('should be true when idps is public', () => {
    expect(permissionUtils.checkFormSubmit({ idps: [IdentityProviders.PUBLIC] })).toBeTruthy();
  });

  it('should be true when permissions is submission creator', () => {
    expect(
      permissionUtils.checkFormSubmit({
        permissions: [FormPermissions.SUBMISSION_CREATE],
      })
    ).toBeTruthy();
  });
});

describe('checkFormManage', () => {
  it('should be false when userForm is undefined', () => {
    expect(permissionUtils.checkFormManage(undefined)).toBeFalsy();
  });

  it('should be false when permissions is undefined', () => {
    expect(permissionUtils.checkFormManage({})).toBeFalsy();
  });

  it('should be true when at least one appropriate permission exists', () => {
    expect(
      permissionUtils.checkFormManage({
        permissions: [FormPermissions.FORM_UPDATE],
      })
    ).toBeTruthy();
    expect(
      permissionUtils.checkFormManage({
        permissions: [FormPermissions.FORM_DELETE],
      })
    ).toBeTruthy();
    expect(
      permissionUtils.checkFormManage({
        permissions: [FormPermissions.DESIGN_UPDATE],
      })
    ).toBeTruthy();
    expect(
      permissionUtils.checkFormManage({
        permissions: [FormPermissions.DESIGN_DELETE],
      })
    ).toBeTruthy();
    expect(
      permissionUtils.checkFormManage({
        permissions: [FormPermissions.TEAM_UPDATE],
      })
    ).toBeTruthy();
  });
});

describe('checkSubmissionView', () => {
  it('should be false when userForm is undefined', () => {
    expect(permissionUtils.checkSubmissionView(undefined)).toBeFalsy();
  });

  it('should be false when permissions is undefined', () => {
    expect(permissionUtils.checkSubmissionView({})).toBeFalsy();
  });

  it('should be true when at least one appropriate permission exists', () => {
    expect(
      permissionUtils.checkSubmissionView({
        permissions: [FormPermissions.SUBMISSION_READ],
      })
    ).toBeTruthy();
    expect(
      permissionUtils.checkSubmissionView({
        permissions: [FormPermissions.SUBMISSION_UPDATE],
      })
    ).toBeTruthy();
  });
});

describe('preFlightAuth', () => {
  const mockNext = jest.fn();
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  const getSubmissionOptionsSpy = jest.spyOn(formService, 'getSubmissionOptions');
  const readFormOptionsSpy = jest.spyOn(formService, 'readFormOptions');

  beforeEach(() => {
    if (store.hasModule('auth')) store.unregisterModule('auth');
    mockNext.mockReset();
    dispatchSpy.mockReset();
    getSubmissionOptionsSpy.mockReset();
    readFormOptionsSpy.mockReset();
  });

  afterAll(() => {
    store.unregisterModule('auth');
    mockNext.mockRestore();
    dispatchSpy.mockRestore();
    getSubmissionOptionsSpy.mockReset();
    readFormOptionsSpy.mockRestore();
  });

  it('should create error notification if options are missing attributes', async () => {
    await permissionUtils.preFlightAuth({}, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    expect(dispatchSpy).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object));
    expect(dispatchSpy).toHaveBeenCalledWith('auth/errorNavigate');
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(0);
  });

  it('should create custom error message if form is 404', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        identityProvider: () => IdentityMode.PUBLIC,
      },
    });

    readFormOptionsSpy.mockImplementation(() => {
      const error = new Error('Not Found');
      error.response = {
        status: 404,
      };

      throw error;
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);

    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(1);
    expect(readFormOptionsSpy).toHaveBeenCalledWith('f');
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith('auth/alertNavigate', expect.any(Object));
    expect(mockNext).toHaveBeenCalledTimes(0);
  });

  it('should create custom error message if form is 422', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        identityProvider: () => IdentityMode.PUBLIC,
      },
    });

    readFormOptionsSpy.mockImplementation(() => {
      const error = new Error('Not Found');
      error.response = {
        status: 422,
      };

      throw error;
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);

    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(1);
    expect(readFormOptionsSpy).toHaveBeenCalledWith('f');
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith('auth/alertNavigate', expect.any(Object));
    expect(mockNext).toHaveBeenCalledTimes(0);
  });

  it('should not create custom error message if form is 500', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        identityProvider: () => IdentityMode.PUBLIC,
      },
    });

    readFormOptionsSpy.mockImplementation(() => {
      const error = new Error('Not Found');
      error.response = {
        status: 500,
      };

      throw error;
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);

    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(1);
    expect(readFormOptionsSpy).toHaveBeenCalledWith('f');
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    expect(dispatchSpy).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object));
    expect(dispatchSpy).toHaveBeenCalledWith('auth/errorNavigate');
    expect(mockNext).toHaveBeenCalledTimes(0);
  });

  it('should not create custom error message if sub is missing', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        identityProvider: () => IdentityMode.PUBLIC,
      },
    });

    readFormOptionsSpy.mockImplementation(() => {
      const error = new Error('Not Found');
      error.response = {
        status: 404,
      };

      throw error;
    });

    await permissionUtils.preFlightAuth({ submissionId: 's' }, mockNext);

    expect(readFormOptionsSpy).toHaveBeenCalledTimes(0);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledWith('s');
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    expect(dispatchSpy).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object));
    expect(dispatchSpy).toHaveBeenCalledWith('auth/errorNavigate');
    expect(mockNext).toHaveBeenCalledTimes(0);
  });

  it('should call readFormOptions and next callback if authenticated and public', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        identityProvider: () => IdentityMode.PUBLIC,
      },
    });
    readFormOptionsSpy.mockResolvedValue({
      data: { idpHints: [IdentityMode.PUBLIC] },
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledTimes(0);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(1);
    expect(readFormOptionsSpy).toHaveBeenCalledWith('f');
  });

  it('should call readFormOptions and next callback if authenticated and idps match', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        identityProvider: () => IdentityProviders.IDIR,
      },
    });
    readFormOptionsSpy.mockResolvedValue({
      data: { idpHints: [IdentityProviders.IDIR] },
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledTimes(0);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(1);
    expect(readFormOptionsSpy).toHaveBeenCalledWith('f');
  });

  it('should call readFormOptions and create error notification with idp mismatch', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        identityProvider: () => IdentityProviders.IDIR,
      },
    });
    readFormOptionsSpy.mockResolvedValue({
      data: { idpHints: [IdentityProviders.BCEIDBASIC] },
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    expect(dispatchSpy).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object));
    expect(dispatchSpy).toHaveBeenCalledWith('auth/errorNavigate', expect.any(String));
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(1);
    expect(readFormOptionsSpy).toHaveBeenCalledWith('f');
  });

  it('should call getSubmissionOptions and next callback if not authenticated and public', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
      },
    });
    getSubmissionOptionsSpy.mockResolvedValue({
      data: { form: { idpHints: [IdentityMode.PUBLIC] } },
    });

    await permissionUtils.preFlightAuth({ submissionId: 's' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledTimes(0);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledWith('s');
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(0);
  });

  it('should call getSubmissionOptions and login flow with idpHint', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
      },
    });
    getSubmissionOptionsSpy.mockResolvedValue({
      data: { form: { idpHints: [IdentityProviders.IDIR] } },
    });

    await permissionUtils.preFlightAuth({ submissionId: 's' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith('auth/login', IdentityProviders.IDIR);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledWith('s');
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(0);
  });

  it('should call getSubmissionOptions and login flow without idpHint', async () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
      },
    });
    getSubmissionOptionsSpy.mockResolvedValue({
      data: { form: { idpHints: ['idp'] } },
    });

    await permissionUtils.preFlightAuth({ submissionId: 's' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith('auth/login');
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledWith('s');
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(0);
  });
});

describe('isFormPublic', () => {
  it('should be false when form is undefined', () => {
    expect(permissionUtils.isFormPublic(undefined)).toBeFalsy();
  });

  it('should be false when idps is undefined', () => {
    expect(permissionUtils.isFormPublic({ blah: [] })).toBeFalsy();
  });

  it('should be true when idps is public', () => {
    expect(
      permissionUtils.isFormPublic({
        identityProviders: [{ code: IdentityMode.PUBLIC }],
      })
    ).toBeTruthy();
  });

  it('should be true when idps includes public', () => {
    expect(
      permissionUtils.isFormPublic({
        identityProviders: [{ code: IdentityMode.LOGIN }, { code: IdentityMode.PUBLIC }],
      })
    ).toBeTruthy();
  });

  it('should be false when idps has something else', () => {
    expect(
      permissionUtils.isFormPublic({
        identityProviders: [{ code: IdentityMode.TEAM }, { code: IdentityMode.LOGIN }],
      })
    ).toBeFalsy();
  });
});
