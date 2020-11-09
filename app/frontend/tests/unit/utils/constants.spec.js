import * as constants from '@/utils/constants';

describe('Constants', () => {
  it('ApiRoutes has the right values defined', () => {
    expect(constants.ApiRoutes).toEqual({
      FORMS: '/forms',
      RBAC: '/rbac',
      ROLES: '/roles',
      USERS: '/users'
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
      TEAM_UPDATE: 'team_update'
    });
  });

  it('IdentityMode has the right values defined', () => {
    expect(constants.IdentityMode).toEqual({
      LOGIN: 'login',
      PUBLIC: 'public',
      TEAM: 'team'
    });
  });

  it('IdentityProviders has the right values defined', () => {
    expect(constants.IdentityProviders).toEqual({
      BCEID: 'bceid',
      BCSC: 'bcsc',
      GITHUB: 'github',
      IDIR: 'idir'
    });
  });

  it('NotificationTypes has the right values defined', () => {
    expect(constants.NotificationTypes).toEqual({
      ERROR: 'error',
      SUCCESS: 'success'
    });
  });
});
