/**
 * Security Decision Predicates
 * Constants for decision predicate names used throughout the runtime-auth security stack
 */

const SECURITY_PREDICATES = {
  // Database permission checks
  HAS_FORM_PERMISSIONS: 'hasFormPermissions',
  HAS_SUBMISSION_PERMISSIONS: 'hasSubmissionPermissions',
  CHECK_SUBMISSION_PERMISSION: 'checkSubmissionPermission',
  GET_USER_FORMS: 'getUserForms',

  // API User decisions
  API_USER_FULL_ACCESS: 'apiUserFullAccess',
  API_USER_FILE_ACCESS: 'apiUserFileAccess',
  API_USER_FILE_API_ACCESS: 'apiUserFileApiAccess',
  API_USER_FILE_CREATE: 'apiUserFileCreate',
  API_USER_FILE_DELETE: 'apiUserFileDelete',
  API_USER_DRAFT_FILE_READ: 'apiUserDraftFileRead',
  API_USER_DRAFT_FILE_DELETE: 'apiUserDraftFileDelete',
  API_USER_DATABASE_SKIP: 'apiUserDatabaseSkip',

  // Public User decisions
  PUBLIC_USER_BASE_ACCESS: 'publicUserBaseAccess',
  PUBLIC_USER_SUBMISSION_READ: 'publicUserSubmissionRead',
  PUBLIC_USER_DRAFT_FILE_ACCESS: 'publicUserDraftFileAccess',
  PUBLIC_USER_SUBMITTED_FILE_ACCESS: 'publicUserSubmittedFileAccess',
  PUBLIC_USER_DATABASE_SKIP: 'publicUserDatabaseSkip',
};

module.exports = SECURITY_PREDICATES;
