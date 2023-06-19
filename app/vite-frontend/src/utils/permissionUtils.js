import {
  FormPermissions,
  FormManagePermissions,
  IdentityMode,
  IdentityProviders,
} from '~/utils/constants';

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
