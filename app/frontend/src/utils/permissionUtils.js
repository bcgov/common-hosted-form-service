import { formService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useNotificationStore } from '~/store/notification';
import { useIdpStore } from '~/store/identityProviders';
import {
  FormPermissions,
  FormManagePermissions,
  IdentityMode,
  NotificationTypes,
} from '~/utils/constants';

import { i18n } from '~/internationalization';
const t = (key) => {
  return i18n.t(key);
};

//
// Utility Functions for determining permissions
//
export function isIdpEnabled(idps, type) {
  return idps ? idps.includes(type) : false;
}

/**
 * @function checkFormSubmit
 * Returns true or false if the user can submit this form
 * @param {Object} userForm The form object for the rbac user
 * @returns {boolean} TRUE if they can
 */
export function checkFormSubmit(userForm) {
  return (
    userForm &&
    userForm.permissions &&
    userForm.permissions.includes(FormPermissions.SUBMISSION_CREATE)
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
 * @function checkSubmissionUpdate
 * Returns true if the user can update submissions of a form, false otherwise
 * @param {Array} permissions A form's permissions array for the rbac user
 * @returns {boolean} TRUE if they can
 */
export function checkSubmissionUpdate(permissions) {
  const perms = [FormPermissions.SUBMISSION_UPDATE];

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
  let errorMessage;
  if (options.formId) {
    const status = error?.response?.status;
    if (status === 404 || status === 422) {
      errorMessage = t('trans.permissionUtils.formNotAvailable');
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
export async function preFlightAuth(options, next) {
  if (!options) options = {};
  const notificationStore = useNotificationStore();
  const idpStore = useIdpStore();
  const authStore = useAuthStore();

  function getValidIdpHints(values) {
    return Array.isArray(values)
      ? values.filter((v) => idpStore.isValidIdpHint(v))
      : [];
  }

  async function fetchIdpHints() {
    if (options.formId) {
      const { data } = await formService.readFormOptions(options.formId);
      return getValidIdpHints(data.idpHints);
    }
    if (options.submissionId) {
      const { data } = await formService.getSubmissionOptions(
        options.submissionId
      );
      return getValidIdpHints(data.form.idpHints);
    }
    throw new Error(t('trans.permissionUtils.missingFormIdAndSubmssId'));
  }

  function handleError(error) {
    const message = getErrorMessage(options, error);
    if (message) {
      notificationStore.alertNavigate(
        NotificationTypes.ERROR.type,
        t('trans.permissionUtils.formNotAvailable')
      );
    } else {
      notificationStore.addNotification({
        text: t('trans.permissionUtils.loadingFormErrMsg'),
        consoleError: {
          text: 'trans.permissionUtils.loadingForm',
          options: { options, error },
        },
      });
      notificationStore.errorNavigate();
    }
  }

  function handleAuthenticated(idpHints, userIdp) {
    if (idpHints.length === 0 || idpHints[0] === IdentityMode.PUBLIC) {
      next();
      return;
    }
    if (userIdp?.hint && idpHints.includes(userIdp.hint)) {
      next();
      return;
    }
    const msg = {
      text: 'trans.permissionUtils.idpHintMsg',
      options: { idpHint: idpHints.map((x) => x.toUpperCase()) },
    };
    notificationStore.addNotification({
      text: t('trans.permissionUtils.idpHintMsg'),
      options: { idpHint: idpHints.map((x) => x.toUpperCase()) },
      consoleError: msg,
    });
    notificationStore.errorNavigate(msg);
  }

  function handleUnauthenticated(idpHints) {
    if (idpHints.length && idpHints[0] === IdentityMode.PUBLIC) {
      next();
    } else if (idpHints.length === 1) {
      authStore.login(idpHints[0]);
    } else if (idpHints.length > 1) {
      authStore.login(idpHints);
    } else {
      authStore.login();
    }
  }

  let idpHints = [];
  try {
    idpHints = await fetchIdpHints();
  } catch (error) {
    handleError(error);
    return;
  }

  if (authStore.authenticated) {
    handleAuthenticated(idpHints, authStore.identityProvider);
  } else {
    handleUnauthenticated(idpHints);
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
