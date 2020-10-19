import { FormPermissions, IdentityProviders } from '@/utils/constants';

//
// Utility Functions for determining permissions
//

/**
 * @function checkFormSubmit
 * Returns true or false if the user can submit this form
 * @param {Object} userForm The form object for the rbac user
 * @returns {boolean} TRUE if they can
 */
const checkFormSubmit = userForm => {
  if (!userForm)
    return false;

  if (userForm.idps && userForm.idps.includes(IdentityProviders.PUBLIC))
    return true;

  if (userForm.permissions && userForm.permissions.includes(FormPermissions.SUBMISSION_CREATE)) {
    return true;
  }

  return false;
};

/**
 * @function checkFormManage
 * Returns true or false if the user can manage the form
 * @param {Object} userForm The form object for the rbac user
 * @returns {boolean} TRUE if they can
 */
const checkFormManage = userForm => {
  if (!userForm)
    return false;

  if (userForm && userForm.permissions && userForm.permissions.includes(
    FormPermissions.FORM_UPDATE, FormPermissions.FORM_DELETE,
    FormPermissions.DESIGN_UPDATE, FormPermissions.DESIGN_DELETE)) {
    return true;
  }

  return false;
};

/**
 * @function checkSubmissionView
 * Returns true or false if the user view submissions of this form
 * @param {Object} userForm The form object for the rbac user
 * @returns {boolean} TRUE if they can
 */
const checkSubmissionView = userForm => {
  if (!userForm)
    return false;

  if (userForm && userForm.permissions && userForm.permissions.includes(FormPermissions.SUBMISSION_READ, FormPermissions.SUBMISSION_UPDATE)) {
    return true;
  }

  return false;
};

export { checkFormManage, checkFormSubmit, checkSubmissionView };
