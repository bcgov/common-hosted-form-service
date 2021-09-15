import { FormPermissions, FormManagePermissions, IdentityMode, IdentityProviders } from '@/utils/constants';
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
  return userForm && userForm.permissions && userForm.permissions.some(p => FormManagePermissions.includes(p));
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
 * @param {String} submissionId The submission guid
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
        // TODO: Figure out way to determine idpHint before starting login flow
        store.dispatch('auth/login');
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

/**
 * @function isFormPublic
 * Returns true for a form object if this form can be viewed by public users
 * @param {Object} form The form object fr
 * @returns {boolean} TRUE if public
 */
export function isFormPublic(form) {
  return form &&
    (form.identityProviders && form.identityProviders.some(i => i.code === IdentityMode.PUBLIC));
}
