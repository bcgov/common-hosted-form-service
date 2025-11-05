/* eslint-env jest */

const PREDICATES = require('../../../../src/runtime-auth/security/predicates');

describe('predicates', () => {
  it('should export database permission check predicates', () => {
    expect(PREDICATES.HAS_FORM_PERMISSIONS).toBe('hasFormPermissions');
    expect(PREDICATES.HAS_SUBMISSION_PERMISSIONS).toBe('hasSubmissionPermissions');
    expect(PREDICATES.CHECK_SUBMISSION_PERMISSION).toBe('checkSubmissionPermission');
    expect(PREDICATES.GET_USER_FORMS).toBe('getUserForms');
  });

  it('should export API user decision predicates', () => {
    expect(PREDICATES.API_USER_FULL_ACCESS).toBe('apiUserFullAccess');
    expect(PREDICATES.API_USER_FILE_ACCESS).toBe('apiUserFileAccess');
    expect(PREDICATES.API_USER_FILE_API_ACCESS).toBe('apiUserFileApiAccess');
    expect(PREDICATES.API_USER_FILE_CREATE).toBe('apiUserFileCreate');
    expect(PREDICATES.API_USER_DRAFT_FILE_READ).toBe('apiUserDraftFileRead');
    expect(PREDICATES.API_USER_DRAFT_FILE_DELETE).toBe('apiUserDraftFileDelete');
    expect(PREDICATES.API_USER_DATABASE_SKIP).toBe('apiUserDatabaseSkip');
  });

  it('should export public user decision predicates', () => {
    expect(PREDICATES.PUBLIC_USER_BASE_ACCESS).toBe('publicUserBaseAccess');
    expect(PREDICATES.PUBLIC_USER_SUBMISSION_READ).toBe('publicUserSubmissionRead');
    expect(PREDICATES.PUBLIC_USER_DRAFT_FILE_ACCESS).toBe('publicUserDraftFileAccess');
    expect(PREDICATES.PUBLIC_USER_SUBMITTED_FILE_ACCESS).toBe('publicUserSubmittedFileAccess');
    expect(PREDICATES.PUBLIC_USER_DATABASE_SKIP).toBe('publicUserDatabaseSkip');
  });

  it('should have string values for all predicates', () => {
    for (const predicate of Object.values(PREDICATES)) {
      expect(typeof predicate).toBe('string');
      expect(predicate.length).toBeGreaterThan(0);
    }
  });
});
