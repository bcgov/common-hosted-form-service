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
    expect(permissionUtils.checkFormSubmit({ permissions: [FormPermissions.SUBMISSION_CREATE] })).toBeTruthy();
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
    expect(permissionUtils.checkFormManage({ permissions: [FormPermissions.FORM_UPDATE] })).toBeTruthy();
    expect(permissionUtils.checkFormManage({ permissions: [FormPermissions.FORM_DELETE] })).toBeTruthy();
    expect(permissionUtils.checkFormManage({ permissions: [FormPermissions.DESIGN_UPDATE] })).toBeTruthy();
    expect(permissionUtils.checkFormManage({ permissions: [FormPermissions.DESIGN_DELETE] })).toBeTruthy();
    expect(permissionUtils.checkFormManage({ permissions: [FormPermissions.TEAM_UPDATE] })).toBeTruthy();
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
    expect(permissionUtils.checkSubmissionView({ permissions: [FormPermissions.SUBMISSION_READ] })).toBeTruthy();
    expect(permissionUtils.checkSubmissionView({ permissions: [FormPermissions.SUBMISSION_UPDATE] })).toBeTruthy();
  });
});

// TODO: This got completely rewritten - need to update tests completely
describe.skip('preFlightAuth', () => {
  const oldWindowLocation = window.location;

  const mockNext = jest.fn();
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  const getSubmissionSpy = jest.spyOn(formService, 'getSubmission');
  const readFormSpy = jest.spyOn(formService, 'readForm');

  beforeAll(() => {
    delete window.location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        replace: {
          configurable: true,
          value: jest.fn(),
        },
      },
    );

    if (store.hasModule('auth')) store.unregisterModule('auth');
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
        createLoginUrl: () => () => { }
      }
    });
  });

  beforeEach(() => {
    mockNext.mockReset();
    dispatchSpy.mockReset();
    getSubmissionSpy.mockReset();
    readFormSpy.mockReset();
  });

  afterAll(() => {
    window.location = oldWindowLocation;
    store.unregisterModule('auth');
    mockNext.mockRestore();
    dispatchSpy.mockRestore();
    getSubmissionSpy.mockReset();
    readFormSpy.mockRestore();
  });

  it('should call readForm service', async () => {
    readFormSpy.mockImplementation(() => { });
    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);
    expect(readFormSpy).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should call getSubmission service', async () => {
    getSubmissionSpy.mockImplementation(() => { });
    await permissionUtils.preFlightAuth({ submissionId: 's' }, mockNext);
    expect(getSubmissionSpy).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);

  });

  it('should passthrough when nothing specified', async () => {
    await permissionUtils.preFlightAuth(undefined, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should force a user login', async () => {
    readFormSpy.mockImplementation(() => {
      const error = new Error();
      error.response = { status: 401 };
      throw error;
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith('auth/login');
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should raise an issue notification', async () => {
    dispatchSpy.mockImplementation(() => { });
    readFormSpy.mockImplementation(() => {
      throw new Error();
    });

    await permissionUtils.preFlightAuth({ formId: 'f' }, mockNext);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object));
    expect(mockNext).toHaveBeenCalledTimes(1);
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
    expect(permissionUtils.isFormPublic({ identityProviders: [{ code: IdentityMode.PUBLIC }] })).toBeTruthy();
  });

  it('should be true when idps includes public', () => {
    expect(permissionUtils.isFormPublic({ identityProviders: [{ code: IdentityMode.LOGIN }, { code: IdentityMode.PUBLIC }] })).toBeTruthy();
  });

  it('should be false when idps has something else', () => {
    expect(permissionUtils.isFormPublic({ identityProviders: [{ code: IdentityMode.TEAM }, { code: IdentityMode.LOGIN }] })).toBeFalsy();
  });
});
