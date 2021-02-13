import { formService } from '@/services';
import { FormPermissions, IdentityProviders } from '@/utils/constants';
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

describe('determineFormNeedsAuth', () => {
  const mockNext = jest.fn();
  const getSubmissionSpy = jest.spyOn(formService, 'getSubmission');
  const readFormSpy = jest.spyOn(formService, 'readForm');

  beforeEach(() => {
    mockNext.mockReset();
    getSubmissionSpy.mockReset();
    readFormSpy.mockReset();
  });

  afterEach(() => {
    mockNext.mockRestore();
    getSubmissionSpy.mockReset();
    readFormSpy.mockRestore();
  });

  it('should call readForm service', async () => {
    readFormSpy.mockImplementation(() => {});
    await permissionUtils.determineFormNeedsAuth('f', undefined, mockNext);
    expect(readFormSpy).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should call getSubmission service', async () => {
    getSubmissionSpy.mockImplementation(() => {});
    await permissionUtils.determineFormNeedsAuth(undefined, 's', mockNext);
    expect(getSubmissionSpy).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should passthrough when nothing specified', async () => {
    await permissionUtils.determineFormNeedsAuth(undefined, undefined, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it.skip('should force a user login', async () => {
    // delete window.location;
    // window.location = { replace: jest.fn() };
    readFormSpy.mockImplementation(() => {
      const error = new Error();
      error.response = { status: 401 };
      throw error;
    });

    await permissionUtils.determineFormNeedsAuth('f', undefined, mockNext);
    expect(window.location.replace).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
