//
// Constants
//

/** API Route paths */
export const ApiRoutes = Object.freeze({
  ADMIN: '/admin',
  APIKEY: '/apiKey',
  FORMS: '/forms',
  RBAC: '/rbac',
  ROLES: '/roles',
  SUBMISSION: '/submissions',
  USERS: '/users',
  FILES: '/files',
  UTILS: '/utils',
  FILES_API_ACCESS: '/filesApiAccess',
});

/** Roles a user can have on a form. These are defined in the DB and sent from the API */
// Note: values are sorted in descending order for accessibility
export const FormRoleCodes = Object.freeze({
  OWNER: 'owner',
  TEAM_MANAGER: 'team_manager',
  FORM_DESIGNER: 'form_designer',
  SUBMISSION_REVIEWER: 'submission_reviewer',
  FORM_SUBMITTER: 'form_submitter',
});

/** Permissions a user can have on a form. These are defined in the DB and sent from the API */
export const FormPermissions = Object.freeze({
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

/** Permissions a user needs to Manage a Form */
export const FormManagePermissions = Object.freeze([
  FormPermissions.FORM_UPDATE,
  FormPermissions.FORM_DELETE,
  FormPermissions.DESIGN_UPDATE,
  FormPermissions.DESIGN_DELETE,
  FormPermissions.TEAM_UPDATE,
]);

/** Chefs/Application flow permissions via User's Identity Provider */
export const AppPermissions = Object.freeze({
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

/** Identity modes that a form can operate in regards to user identification */
export const IdentityMode = Object.freeze({
  LOGIN: 'login', // Requires Login
  PUBLIC: 'public', // Anonymous
  TEAM: 'team', // Specific People
});

/** List of Ministries within BC Public Service */
export const Ministries = Object.freeze([
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

/** Corresponds to the values of form profile fields */
export const FormProfileValues = Object.freeze({
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

/** Corresponds to vuetify alert classes for notification types */
export const NotificationTypes = Object.freeze({
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

export const Regex = Object.freeze({
  // From ajv-format
  EMAIL:
    "^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$",
});

/** Identity modes that a form can operate in regards to user identification */
export const ScheduleType = Object.freeze({
  MANUAL: 'manual', // Requires Login
  CLOSINGDATE: 'closingDate', // Anonymous
  PERIOD: 'period', // Specific People
});

/** Constants for Export large data submission feature */
export const ExportLargeData = Object.freeze({
  MAX_RECORDS: 300, // Maximum number of submissions after that we gonna upload the export to Cloud and send user a download link via email
  MAX_FIELDS: 30, // Maximum number of fields in a form after that we gonna upload the export to Cloud and send user a download link via email
});
