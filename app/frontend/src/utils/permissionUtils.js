import { formService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useNotificationStore } from '~/store/notification';
import {
  FormPermissions,
  FormManagePermissions,
  IdentityMode,
  IdentityProviders,
  NotificationTypes,
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
 * Returns true if the user can manage a form, false otherwise
 * @param {Array} userForm A form's permissions array for the rbac user
 * @returns {boolean} TRUE if they can
 */
export function checkFormManage(permissions) {
  return (
    permissions && permissions.some((p) => FormManagePermissions.includes(p))
  );
}

/**
 * @function checkSubmissionView
 * Returns true if the user can view submissions of a form, false otherwise
 * @param {Array} permissions A form's permissions array for the rbac user
 * @returns {boolean} TRUE if they can
 */
export function checkSubmissionView(permissions) {
  const perms = [
    FormPermissions.SUBMISSION_READ,
    FormPermissions.SUBMISSION_UPDATE,
  ];

  return permissions && permissions.some((p) => perms.includes(p));
}

/**
 * @function getErrorMessage
 * Gets the message to display for preflight errors. Expand this to add
 * friendlier messages for other errors.
 * @param {Object} options - The Object containing preflight request details.
 * @param {Error} error - The error that was produced.
 * @returns {string|undefined} - The error message to display, or undefined to
 *    use the default message.
 */
function getErrorMessage(options, error) {
  let errorMessage = undefined;
  if (options.formId) {
    const status = error?.response?.status;
    if (status === 404 || status === 422) {
      errorMessage = 'trans.permissionUtils.formNotAvailable';
    }
  }
  return errorMessage;
}

/**
 * @function preFlightAuth
 * Determines whether to enter a route based on user authentication state and idpHint
 * @param {Object} options Object containing either a formId or submissionId attribute
 * @param {Object} next The callback function
 */
export async function preFlightAuth(options = {}, next) {
  const notificationStore = useNotificationStore();
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
      throw new Error('trans.permissionUtils.missingFormIdAndSubmssId');
    }
  } catch (error) {
    // Halt user with error page, use alertNavigate for "friendly" messages.
    const message = getErrorMessage(options, error);
    if (message) {
      // Don't display the 'An error has occurred...' popup notification.
      notificationStore.alertNavigate(
        NotificationTypes.ERROR.type,
        'trans.permissionUtils.formNotAvailable'
      );
    } else {
      notificationStore.addNotification({
        text: 'trans.permissionUtils.loadingFormErrMsg',
        consoleError: {
          text: 'trans.permissionUtils.loadingForm',
          options: {
            options,
            error,
          },
        },
      });
      notificationStore.errorNavigate();
    }

    return; // Short circuit this function - no point executing further logic
  }

  const authStore = useAuthStore();

  if (authStore.authenticated) {
    const userIdp = authStore.identityProvider;

    if (idpHint === IdentityMode.PUBLIC || !idpHint) {
      next(); // Permit navigation if public or team form
    } else if (isValidIdp(idpHint) && userIdp === idpHint) {
      next(); // Permit navigation if idps match
    } else {
      const msg = {
        text: 'trans.permissionUtils.idpHintMsg',
        options: {
          idpHint: idpHint.toUpperCase(),
        },
      };
      notificationStore.addNotification({
        ...msg,
        consoleError: msg,
      });
      notificationStore.errorNavigate(msg);
    }
  } else {
    if (idpHint === IdentityMode.PUBLIC) {
      next(); // Permit navigation if public form
    } else if (isValidIdp(idpHint)) {
      authStore.login(idpHint); // Force login flow with specified idpHint
    } else {
      authStore.login(); // Force login flow with user choice
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
