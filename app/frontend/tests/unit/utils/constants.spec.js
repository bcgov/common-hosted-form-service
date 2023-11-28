import { describe, expect, it } from 'vitest';
import * as constants from '~/utils/constants';

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
      IDIR: 'idir',
    });
  });

  it('Ministries array has the right values defined', () => {
    expect(constants.Ministries).toEqual([
      { id: 'AF', text: 'Agriculture and Food (AF)' },
      { id: 'AG', text: 'Attorney General (AG)' },
      { id: 'MCF', text: 'Children and Family Development (MCF)' },
      { id: 'CITZ', text: `Citizens' Services (CITZ)` },
      { id: 'ECC', text: 'Education and Child Care (ECC)' },
      { id: 'EMCR', text: 'Emergency Management and Climate Readiness (EMCR)' },
      { id: 'EMLI', text: 'Energy, Mines and Low Carbon Innovation (EMLI)' },
      { id: 'ENV', text: 'Environment and Climate Change Strategy (ENV)' },
      { id: 'FIN', text: 'Finance (FIN)' },
      { id: 'FOR', text: 'Forests (FOR)' },
      { id: 'HLTH', text: 'Health (HLTH)' },
      { id: 'HOUS', text: 'Housing (HOUS)' },
      { id: 'IRR', text: 'Indigenous Relations & Reconciliation (IRR)' },
      { id: 'JEDI', text: 'Jobs, Economic Development and Innovation (JEDI)' },
      { id: 'LBR', text: 'Labour (LBR)' },
      { id: 'MMHA', text: 'Mental Health and Addictions (MMHA)' },
      { id: 'MUNI', text: 'Municipal Affairs (MUNI)' },
      { id: 'PSFS', text: 'Post-Secondary Education and Future Skills (PSFS)' },
      { id: 'PSSG', text: 'Public Safety and Solicitor General (PSSG)' },
      { id: 'SDPR', text: 'Social Development and Poverty Reduction (SDPR)' },
      { id: 'TACS', text: 'Tourism, Arts, Culture and Sport (TACS)' },
      { id: 'MOTI', text: 'Transportation and Infrastructure (MOTI)' },
      { id: 'WLRS', text: 'Water, Land and Resource Stewardship (WLRS)' },
    ]);
  });

  it('FormProfileValues has the right values defined', () => {
    expect(constants.FormProfileValues).toEqual({
      APPLICATION: 'application',
      COLLECTION: 'collection',
      FEEDBACK: 'feedback',
      REGISTRATION: 'registration',
      REPORT: 'report',
      DEVELOPMENT: 'development',
      PRODUCTION: 'production',
      TEST: 'test',
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
