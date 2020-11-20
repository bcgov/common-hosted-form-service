import { FormPermissions, IdentityProviders } from '@/utils/constants';
import { formService } from '@/services';
import store from '@/store';

//
// Utility Functions for determining permissions
//

/**
 * @function checkFormSubmit
 * Returns true or false if the user can submit this form
 * @param {Object} userForm The form object for the rbac user
 * @returns {boolean} TRUE if they can
 */
export function checkFormSubmit(userForm) {
  return userForm &&
    (userForm.idps && userForm.idps.includes(IdentityProviders.PUBLIC) ||
      userForm.permissions && userForm.permissions.includes(FormPermissions.SUBMISSION_CREATE));
}

/**
 * @function checkFormManage
 * Returns true or false if the user can manage the form
 * @param {Object} userForm The form object for the rbac user
 * @returns {boolean} TRUE if they can
 */
export function checkFormManage(userForm) {
  const perms = [
    FormPermissions.FORM_UPDATE,
    FormPermissions.FORM_DELETE,
    FormPermissions.DESIGN_UPDATE,
    FormPermissions.DESIGN_DELETE
  ];
  return userForm && userForm.permissions && userForm.permissions.some(p => perms.includes(p));
}

/**
 * @function checkSubmissionView
 * Returns true or false if the user view submissions of this form
 * @param {Object} userForm The form object for the rbac user
 * @returns {boolean} TRUE if they can
 */
export function checkSubmissionView(userForm) {
  const perms = [
    FormPermissions.SUBMISSION_READ,
    FormPermissions.SUBMISSION_UPDATE
  ];
  return userForm && userForm.permissions && userForm.permissions.some(p => perms.includes(p));
}

/**
 * @function determineFormNeedsAuth
 * When loading a form to fill out, determine if the user needs to log in to submit it
 * @param {Object} store The vuex store reference
 * @param {String} formId The form guid
 * @param {String} formId The submissionId guid
 * @param {Object} next The routing next object
 */
export async function determineFormNeedsAuth(formId, submissionId, next) {
  // before this view is loaded, determine if this is a public form
  // if it IS, they don't need to log in. If it's secured, go through auth loop
  // If authed already skip all this
  if (!store.getters['auth/authenticated']) {
    try {
      // Get this form or submission
      if (formId) {
        await formService.readForm(formId);
      } else if (submissionId) {
        await formService.getSubmission(submissionId);
      }
    } catch (error) {
      // If there's a 401 trying to get this form, make that user log in
      if (error.response && error.response.status === 401) {
        window.location.replace(
          store.getters['auth/createLoginUrl']({ idpHint: 'idir' })
        );
      } else {
        // Other errors raise an issue
        store.dispatch('notifications/addNotification', {
          message: 'An error occurred while loading this form.',
          consoleError: `Error loading form ${formId} or submission ${submissionId}: ${error}`,
        });
      }
    }
  }
  next();
}
