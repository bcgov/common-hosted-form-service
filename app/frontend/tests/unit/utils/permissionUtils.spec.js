import { setActivePinia, createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import { formService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useNotificationStore } from '~/store/notification';
import {
  FormPermissions,
  IdentityProviders,
  IdentityMode,
} from '~/utils/constants';
import * as permissionUtils from '~/utils/permissionUtils';

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
    expect(
      permissionUtils.checkFormSubmit({ idps: [IdentityProviders.PUBLIC] })
    ).toBeTruthy();
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
  it('should be false when permissions is undefined', () => {
    expect(permissionUtils.checkFormManage(undefined)).toBeFalsy();
  });

  it('should be false when permissions is empty', () => {
    expect(permissionUtils.checkFormManage([])).toBeFalsy();
  });

  it('should be false when no appropriate permission exists', () => {
    let permissions = new Array(FormPermissions)
      .filter((p) => p !== FormPermissions.FORM_UPDATE)
      .filter((p) => p !== FormPermissions.FORM_DELETE)
      .filter((p) => p !== FormPermissions.DESIGN_UPDATE)
      .filter((p) => p !== FormPermissions.DESIGN_DELETE)
      .filter((p) => p !== FormPermissions.TEAM_UPDATE);

    expect(permissionUtils.checkFormManage(permissions)).not.toBeTruthy();
  });

  it('should be true when at least one appropriate permission exists', () => {
    expect(
      permissionUtils.checkFormManage([FormPermissions.FORM_UPDATE])
    ).toBeTruthy();
    expect(
      permissionUtils.checkFormManage([FormPermissions.FORM_DELETE])
    ).toBeTruthy();
    expect(
      permissionUtils.checkFormManage([FormPermissions.DESIGN_UPDATE])
    ).toBeTruthy();
    expect(
      permissionUtils.checkFormManage([FormPermissions.DESIGN_DELETE])
    ).toBeTruthy();
    expect(
      permissionUtils.checkFormManage([FormPermissions.TEAM_UPDATE])
    ).toBeTruthy();
  });
});

describe('checkSubmissionView', () => {
  it('should be false when permissions is undefined', () => {
    expect(permissionUtils.checkSubmissionView(undefined)).toBeFalsy();
  });

  it('should be false when permissions is empty', () => {
    expect(permissionUtils.checkSubmissionView([])).toBeFalsy();
  });

  it('should be false when no appropriate permission exists', () => {
    let permissions = new Array(FormPermissions)
      .filter((p) => p !== FormPermissions.SUBMISSION_READ)
      .filter((p) => p !== FormPermissions.SUBMISSION_UPDATE);

    expect(permissionUtils.checkSubmissionView(permissions)).not.toBeTruthy();
  });

  it('should be true when at least one appropriate permission exists', () => {
    expect(
      permissionUtils.checkSubmissionView([FormPermissions.SUBMISSION_READ])
    ).toBeTruthy();
    expect(
      permissionUtils.checkSubmissionView([FormPermissions.SUBMISSION_UPDATE])
    ).toBeTruthy();
  });
});

describe('preFlightAuth', () => {
  setActivePinia(createPinia());
  const authStore = useAuthStore();
  const notificationStore = useNotificationStore();
  const mockNext = vi.fn();
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  const alertNavigateSpy = vi.spyOn(notificationStore, 'alertNavigate');
  const errorNavigateSpy = vi.spyOn(notificationStore, 'errorNavigate');
  const getSubmissionOptionsSpy = vi.spyOn(formService, 'getSubmissionOptions');
  const readFormOptionsSpy = vi.spyOn(formService, 'readFormOptions');

  beforeEach(() => {
    authStore.$reset();
    notificationStore.$reset();
    mockNext.mockReset();
    addNotificationSpy.mockReset();
    alertNavigateSpy.mockReset();
    errorNavigateSpy.mockReset();
    getSubmissionOptionsSpy.mockReset();
    readFormOptionsSpy.mockReset();
  });

  afterAll(() => {
    mockNext.mockRestore();
    getSubmissionOptionsSpy.mockReset();
    readFormOptionsSpy.mockRestore();
  });

  it('should create error notification if options are missing attributes', async () => {
    await permissionUtils.preFlightAuth({}, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(0);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(errorNavigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should create custom error message if form is 404', async () => {
    authStore.authenticated = true;
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: IdentityProviders.PUBLIC,
      },
    };

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
    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(alertNavigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should create custom error message if form is 422', async () => {
    authStore.authenticated = true;
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: IdentityProviders.PUBLIC,
      },
    };
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
    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(alertNavigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should not create custom error message if form is 500', async () => {
    authStore.authenticated = true;
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: IdentityProviders.PUBLIC,
      },
    };
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const errorNavigateSpy = vi.spyOn(notificationStore, 'errorNavigate');
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
    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(errorNavigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should not create custom error message if sub is missing', async () => {
    authStore.authenticated = true;
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: IdentityProviders.PUBLIC,
      },
    };
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const errorNavigateSpy = vi.spyOn(notificationStore, 'errorNavigate');
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
    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(errorNavigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should call readFormOptions and next callback if authenticated and public', async () => {
    authStore.authenticated = true;
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: IdentityProviders.PUBLIC,
      },
    };
    readFormOptionsSpy.mockResolvedValue({
      data: { idpHints: [IdentityMode.PUBLIC] },
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(1);
    expect(readFormOptionsSpy).toHaveBeenCalledWith('f');
  });

  it('should call readFormOptions and next callback if authenticated and idps match', async () => {
    authStore.authenticated = true;
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: IdentityProviders.IDIR,
      },
    };
    readFormOptionsSpy.mockResolvedValue({
      data: { idpHints: [IdentityProviders.IDIR] },
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(1);
    expect(readFormOptionsSpy).toHaveBeenCalledWith('f');
  });

  it('should call readFormOptions and create error notification with idp mismatch', async () => {
    authStore.authenticated = true;
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: IdentityProviders.IDIR,
      },
    };
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const errorNavigateSpy = vi.spyOn(notificationStore, 'errorNavigate');
    readFormOptionsSpy.mockResolvedValue({
      data: { idpHints: [IdentityProviders.BCEIDBASIC] },
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(errorNavigateSpy).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(0);
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(1);
    expect(readFormOptionsSpy).toHaveBeenCalledWith('f');
  });

  it('should call getSubmissionOptions and next callback if not authenticated and public', async () => {
    authStore.authenticated = false;
    getSubmissionOptionsSpy.mockResolvedValue({
      data: { form: { idpHints: [IdentityMode.PUBLIC] } },
    });

    await permissionUtils.preFlightAuth({ submissionId: 's' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledWith('s');
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(0);
  });

  it('should call getSubmissionOptions and login flow with idpHint', async () => {
    authStore.authenticated = false;
    getSubmissionOptionsSpy.mockResolvedValue({
      data: { form: { idpHints: [IdentityProviders.IDIR] } },
    });

    await permissionUtils.preFlightAuth({ submissionId: 's' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(0);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledTimes(1);
    expect(getSubmissionOptionsSpy).toHaveBeenCalledWith('s');
    expect(readFormOptionsSpy).toHaveBeenCalledTimes(0);
  });

  it('should call getSubmissionOptions and login flow without idpHint', async () => {
    authStore.authenticated = false;
    getSubmissionOptionsSpy.mockResolvedValue({
      data: { form: { idpHints: ['idp'] } },
    });

    await permissionUtils.preFlightAuth({ submissionId: 's' }, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(0);
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
        identityProviders: [
          { code: IdentityMode.LOGIN },
          { code: IdentityMode.PUBLIC },
        ],
      })
    ).toBeTruthy();
  });

  it('should be false when idps has something else', () => {
    expect(
      permissionUtils.isFormPublic({
        identityProviders: [
          { code: IdentityMode.TEAM },
          { code: IdentityMode.LOGIN },
        ],
      })
    ).toBeFalsy();
  });
});
