import { describe, expect, it } from 'vitest';
import * as constants from '~/utils/constants';

describe('Constants', () => {
  it('ApiRoutes has the right values defined', () => {
    expect(constants.ApiRoutes).toEqual({
      ADMIN: '/admin',
      APIKEY: '/apiKey',
      EXTERNAL_APIS: '/externalAPIs',
      FILES: '/files',
      FORMS: '/forms',
      RBAC: '/rbac',
      ROLES: '/roles',
      SUBMISSION: '/submissions',
      USERS: '/users',
      UTILS: '/utils',
      FILES_API_ACCESS: '/filesApiAccess',
      PROXY: '/proxy',
      FORM_METADATA: '/formMetadata',
    });
  });

  it('FormRoleCodes has the right values defined', () => {
    expect(constants.FormRoleCodes).toEqual({
      OWNER: 'owner',
      TEAM_MANAGER: 'team_manager',
      FORM_DESIGNER: 'form_designer',
      SUBMISSION_APPROVER: 'submission_approver',
      SUBMISSION_REVIEWER: 'submission_reviewer',
      FORM_SUBMITTER: 'form_submitter',
    });
  });

  it('FormPermissions has the right values defined', () => {
    expect(constants.FormPermissions).toEqual({
      EMAIL_TEMPLATE_READ: 'email_template_read',
      EMAIL_TEMPLATE_UPDATE: 'email_template_update',
      FORM_API_CREATE: 'form_api_create',
      FORM_API_READ: 'form_api_read',
      FORM_API_UPDATE: 'form_api_update',
      FORM_API_DELETE: 'form_api_delete',
      FORM_READ: 'form_read',
      FORM_UPDATE: 'form_update',
      FORM_DELETE: 'form_delete',
      SUBMISSION_CREATE: 'submission_create',
      SUBMISSION_READ: 'submission_read',
      SUBMISSION_REVIEW: 'submission_review',
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

  it('AppPermissions has the right values defined', () => {
    expect(constants.AppPermissions).toEqual({
      VIEWS_FORM_STEPPER: 'views_form_stepper',
      VIEWS_ADMIN: 'views_admin',
      VIEWS_FILE_DOWNLOAD: 'views_file_download',
      VIEWS_FORM_EMAILS: 'views_form_emails',
      VIEWS_FORM_EXPORT: 'views_form_export',
      VIEWS_FORM_MANAGE: 'views_form_manage',
      VIEWS_FORM_PREVIEW: 'views_form_preview',
      VIEWS_FORM_SUBMISSIONS: 'views_form_submissions',
      VIEWS_FORM_TEAMS: 'views_form_teams',
      VIEWS_FORM_VIEW: 'views_form_view',
      VIEWS_USER_SUBMISSIONS: 'views_user_submissions',
    });
  });

  it('Ministries array has the right values defined', () => {
    expect(constants.Ministries).toEqual([
      { id: 'AF', text: 'trans.ministries.AF' },
      { id: 'AG', text: 'trans.ministries.AG' },
      { id: 'MCF', text: 'trans.ministries.MCF' },
      { id: 'CITZ', text: 'trans.ministries.CITZ' },
      { id: 'ECC', text: 'trans.ministries.ECC' },
      { id: 'EMCR', text: 'trans.ministries.EMCR' },
      { id: 'EMLI', text: 'trans.ministries.EMLI' },
      { id: 'ENV', text: 'trans.ministries.ENV' },
      { id: 'FIN', text: 'trans.ministries.FIN' },
      { id: 'FOR', text: 'trans.ministries.FOR' },
      { id: 'HLTH', text: 'trans.ministries.HLTH' },
      { id: 'HOUS', text: 'trans.ministries.HOUS' },
      { id: 'IRR', text: 'trans.ministries.IRR' },
      { id: 'JEDI', text: 'trans.ministries.JEDI' },
      { id: 'LBR', text: 'trans.ministries.LBR' },
      { id: 'MMHA', text: 'trans.ministries.MMHA' },
      { id: 'MUNI', text: 'trans.ministries.MUNI' },
      { id: 'PSFS', text: 'trans.ministries.PSFS' },
      { id: 'PSSG', text: 'trans.ministries.PSSG' },
      { id: 'SDPR', text: 'trans.ministries.SDPR' },
      { id: 'TACS', text: 'trans.ministries.TACS' },
      { id: 'MOTI', text: 'trans.ministries.MOTI' },
      { id: 'WLRS', text: 'trans.ministries.WLRS' },
    ]);
  });

  it('FormProfileValues has the right values defined', () => {
    expect(constants.FormProfileValues).toEqual({
      DEVELOPMENT: 'development',
      PRODUCTION: 'production',
      TEST: 'test',
      USE_CASE: Object.freeze([
        { id: 'application', text: 'trans.formProfile.application' },
        { id: 'collection', text: 'trans.formProfile.collection' },
        { id: 'registration', text: 'trans.formProfile.registration' },
        { id: 'report', text: 'trans.formProfile.report' },
        { id: 'feedback', text: 'trans.formProfile.feedback' },
      ]),
    });
  });

  it('NotificationTypes has the right values defined', () => {
    expect(constants.NotificationTypes).toEqual({
      ERROR: {
        color: 'error',
        type: 'error',
        icon: '$error',
      },
      SUCCESS: {
        color: 'success',
        type: 'success',
        icon: 'mdi:mdi-check-circle',
      },
      INFO: {
        color: 'info',
        type: 'info',
        icon: '$info',
      },
      WARNING: {
        color: 'warning',
        type: 'warning',
        icon: '$warning',
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
