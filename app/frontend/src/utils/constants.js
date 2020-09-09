//
// Constants
//

// API Route paths
const ApiRoutes = Object.freeze({
  FORMS: '/forms'
});

// Permissions a user can have on a form. These are defined in the DB and sent from the API
const FormPermissions = Object.freeze({
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

// Identitiy Providers a user can log in as and a form can be allowed for
const IdentityProviders = Object.freeze({
  BCEID: 'bceid', // BCeID
  BCSC: 'bcsc', // Services Card
  GITHUB: 'github', // Github
  IDIR: 'idir', // IDIR
  PUBLIC: 'public' // Anonymous
});

export { ApiRoutes, FormPermissions, IdentityProviders };
