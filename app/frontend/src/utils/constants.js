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

/** Identity modes that a form can operate in regards to user identification */
export const IdentityMode = Object.freeze({
  LOGIN: 'login', // Requires Login
  PUBLIC: 'public', // Anonymous
  TEAM: 'team', // Specific People
});

/** Identitiy Providers a user can log in as and a form can be allowed for */
export const IdentityProviders = Object.freeze({
  BCEIDBASIC: 'bceid-basic', // Basic BCeID
  BCEIDBUSINESS: 'bceid-business', // Business BCeID
  IDIR: 'idir', // IDIR
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
