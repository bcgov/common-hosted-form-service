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
  if (!option) {
    throw new Error(`Could not retrieve options for form ${formName}`);
  }
  return option;
};

export { checkFormSubmit };
