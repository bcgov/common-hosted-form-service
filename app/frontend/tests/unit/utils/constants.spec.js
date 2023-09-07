import * as constants from '@/utils/constants';

describe('Constants', () => {
  it('ApiRoutes has the right values defined', () => {
    expect(constants.ApiRoutes).toEqual({
      ADMIN: '/admin',
      APIKEY: '/apiKey',
      FILES: '/files',
      FORMS: '/forms',
      RBAC: '/rbac',
      ROLES: '/roles',
      SUBMISSION: '/submissions',
      USERS: '/users',
      UTILS: '/utils',
    });
  });

  it('FormRoleCodes has the right values defined', () => {
    expect(constants.FormRoleCodes).toEqual({
      OWNER: 'owner',
      TEAM_MANAGER: 'team_manager',
      FORM_DESIGNER: 'form_designer',
      SUBMISSION_REVIEWER: 'submission_reviewer',
      FORM_SUBMITTER: 'form_submitter',
    });
  });

  it('FormPermissions has the right values defined', () => {
    expect(constants.FormPermissions).toEqual({
      FORM_API_CREATE: 'form_api_create',
      FORM_API_READ: 'form_api_read',
      FORM_API_UPDATE: 'form_api_update',
      FORM_API_DELETE: 'form_api_delete',
      FORM_READ: 'form_read',
      FORM_UPDATE: 'form_update',
      FORM_DELETE: 'form_delete',
      SUBMISSION_CREATE: 'submission_create',
      SUBMISSION_READ: 'submission_read',
      SUBMISSION_UPDATE: 'submission_update',
      SUBMISSION_DELETE: 'submission_delete',
      DESIGN_CREATE: 'design_create',
      DESIGN_READ: 'design_read',
      DESIGN_UPDATE: 'design_update',
      DESIGN_DELETE: 'design_delete',
      TEAM_READ: 'team_read',
      TEAM_UPDATE: 'team_update',
    });
  });

  it('FormManagePermissions has the right values defined', () => {
    expect(constants.FormManagePermissions).toEqual([
      constants.FormPermissions.FORM_UPDATE,
      constants.FormPermissions.FORM_DELETE,
      constants.FormPermissions.DESIGN_UPDATE,
      constants.FormPermissions.DESIGN_DELETE,
      constants.FormPermissions.TEAM_UPDATE,
    ]);
  });

  it('IdentityMode has the right values defined', () => {
    expect(constants.IdentityMode).toEqual({
      LOGIN: 'login',
      PUBLIC: 'public',
      TEAM: 'team',
    });
  });

  it('IdentityProviders has the right values defined', () => {
    expect(constants.IdentityProviders).toEqual({
      BCEIDBASIC: 'bceid-basic',
      BCEIDBUSINESS: 'bceid-business',
      BCSC: 'bcsc',
      GITHUB: 'github',
      IDIR: 'idir',
    });
  });

  it('NotificationTypes has the right values defined', () => {
    expect(constants.NotificationTypes).toEqual({
      ERROR: {
        type: 'error',
        class: 'alert-error',
        icon: 'error',
      },
      SUCCESS: {
        type: 'success',
        class: 'alert-success',
        icon: 'check_circle',
      },
      INFO: {
        type: 'info',
        class: 'alert-info',
        icon: 'info',
      },
      WARNING: {
        type: 'warning',
        class: 'alert-warning',
        icon: 'warning',
      },
    });
  });

  it('Regex has the right values defined', () => {
    expect(constants.Regex).toEqual({
      EMAIL:
        "^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$",
    });
  });
});
