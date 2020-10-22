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
