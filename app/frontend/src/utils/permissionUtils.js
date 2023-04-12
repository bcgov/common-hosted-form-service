import { formService } from '@/services';
import store from '@/store';
import {
  FormPermissions,
  FormManagePermissions,
  IdentityMode,
  IdentityProviders,
} from '@/utils/constants';

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
  return (
    userForm &&
    ((userForm.idps && userForm.idps.includes(IdentityProviders.PUBLIC)) ||
      (userForm.permissions &&
        userForm.permissions.includes(FormPermissions.SUBMISSION_CREATE)))
  );
}

/**
 * @function checkFormManage
 * Returns true or false if the user can manage the form
 * @param {Object} userForm The form object for the rbac user
 * @returns {boolean} TRUE if they can
 */
export function checkFormManage(userForm) {
  return (
    userForm &&
    userForm.permissions &&
    userForm.permissions.some((p) => FormManagePermissions.includes(p))
  );
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
    FormPermissions.SUBMISSION_UPDATE,
  ];
  return (
    userForm &&
    userForm.permissions &&
    userForm.permissions.some((p) => perms.includes(p))
  );
}

/**
 * @function preFlightAuth
 * Determines whether to enter a route based on user authentication state and idpHint
 * @param {Object} options Object containing either a formId or submissionId attribute
 * @param {Object} next The callback function
 */
export async function preFlightAuth(options = {}, next) {
  // Support lambda functions (Consider making them util functions?)
  const getIdpHint = (values) => {
    return Array.isArray(values) && values.length ? values[0] : undefined;
  };
  const isValidIdp = (value) =>
    Object.values(IdentityProviders).includes(value);

  // Determine current form or submission idpHint if available
  let idpHint = undefined;
  try {
    if (options.formId) {
      const { data } = await formService.readFormOptions(options.formId);
      idpHint = getIdpHint(data.idpHints);
    } else if (options.submissionId) {
      const { data } = await formService.getSubmissionOptions(
        options.submissionId
      );
      idpHint = getIdpHint(data.form.idpHints);
    } else {
      throw new Error('Options missing both formId and submissionId');
    }
  } catch (error) {
    store.dispatch('notifications/addNotification', {
      message: 'An error occurred while loading this form.',
      consoleError: `Error while loading ${JSON.stringify(options)}: ${error}`,
    });
    store.dispatch('auth/errorNavigate'); // Halt user with error page
    return; // Short circuit this function - no point executing further logic
  }

  if (store.getters['auth/authenticated']) {
    const userIdp = store.getters['auth/identityProvider'];

    if (idpHint === IdentityMode.PUBLIC || !idpHint) {
      next(); // Permit navigation if public or team form
    } else if (isValidIdp(idpHint) && userIdp === idpHint) {
      next(); // Permit navigation if idps match
    } else {
      const msg = `This form requires ${idpHint.toUpperCase()} authentication. Please re-login and try again.`;
      store.dispatch('notifications/addNotification', {
        message: msg,
        consoleError: `Form IDP mismatch. Form requires ${idpHint} but user has ${userIdp}.`,
      });
      store.dispatch('auth/errorNavigate', msg); // Halt user with idp mismatch error page
    }
  } else {
    if (idpHint === IdentityMode.PUBLIC) {
      next(); // Permit navigation if public form
    } else if (isValidIdp(idpHint)) {
      store.dispatch('auth/login', idpHint); // Force login flow with specified idpHint
    } else {
      store.dispatch('auth/login'); // Force login flow with user choice
    }
  }
}

/**
 * @function isFormPublic
 * Returns true for a form object if this form can be viewed by public users
 * @param {Object} form The form object fr
 * @returns {boolean} TRUE if public
 */
export function isFormPublic(form) {
  return (
    form &&
    form.identityProviders &&
    form.identityProviders.some((i) => i.code === IdentityMode.PUBLIC)
  );
}
