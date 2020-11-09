//
// Constants
//

/** API Route paths */
export const ApiRoutes = Object.freeze({
  FORMS: '/forms',
  RBAC: '/rbac',
  ROLES: '/roles',
  USERS: '/users'
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

/** Identity modes that a form can operate in regards to user identification */
export const IdentityMode = Object.freeze({
  LOGIN: 'login', // Requires Login
  PUBLIC: 'public', // Anonymous
  TEAM: 'team' // Specific People
});

/** Identitiy Providers a user can log in as and a form can be allowed for */
export const IdentityProviders = Object.freeze({
  BCEID: 'bceid', // BCeID
  BCSC: 'bcsc', // Services Card
  GITHUB: 'github', // Github
  IDIR: 'idir' // IDIR
});

/** Corresponds to vuetfy alert classes for notification types */
export const NotificationTypes = Object.freeze({
  ERROR: 'error',
  SUCCESS: 'success'
});
