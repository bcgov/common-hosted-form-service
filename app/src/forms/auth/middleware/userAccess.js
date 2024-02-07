const Problem = require('api-problem');
const { validate } = require('uuid');

const keycloak = require('../../../components/keycloak');
const Permissions = require('../../common/constants').Permissions;
const Roles = require('../../common/constants').Roles;
const service = require('../service');
const formService = require('../../form/service');
const rbacService = require('../../rbac/service');

const getToken = (req) => {
  try {
    return req.kauth.grant.access_token;
  } catch (err) {
    return null;
  }
};

const setUser = async (req, _res, next) => {
  try {
    const token = getToken(req);
    req.currentUser = await service.login(token);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for routes that include both a formId and
 * formVersionDraftId. Checks that the form has the corresponding form draft and
 * that it isn't a draft for some other form.
 *
 * @param {*} req the Express object representing the HTTP request
 * @param {*} _res the Express object representing the HTTP response - unused
 * @param {*} next the Express chaining function
 */
const checkFormVersionDraftId = async (req, _res, next) => {
  try {
    const formId = req.params.formId;
    if (!validate(formId)) {
      throw new Problem(400, {
        detail: `Bad formId "${formId}".`,
      });
    }

    const formVersionDraftId = req.params.formVersionDraftId;
    if (!validate(formVersionDraftId)) {
      throw new Problem(400, {
        detail: `Bad formVersionDraftId "${formVersionDraftId}".`,
      });
    }

    const formVersionDraft = await formService.readDraft(formVersionDraftId);
    if (formVersionDraft.formId !== formId) {
      throw new Problem(404, {
        detail: `formId "${formId}" does not have formVersionDraftId "${formVersionDraftId}".`,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for routes that include both a formId and formVersionId.
 * Checks that the form has the corresponding form version and that it isn't
 * a version for some other form.
 *
 * @param {*} req the Express object representing the HTTP request
 * @param {*} _res the Express object representing the HTTP response - unused
 * @param {*} next the Express chaining function
 */
const checkFormVersionId = async (req, _res, next) => {
  try {
    const formId = req.params.formId;
    if (!validate(formId)) {
      throw new Problem(400, {
        detail: `Bad formId "${formId}".`,
      });
    }

    const formVersionId = req.params.formVersionId;
    if (!validate(formVersionId)) {
      throw new Problem(400, {
        detail: `Bad formVersionId "${formVersionId}".`,
      });
    }

    const formVersion = await formService.readVersion(formVersionId);
    if (formVersion.formId !== formId) {
      throw new Problem(404, {
        detail: `formId "${formId}" does not have formVersionId "${formVersionId}".`,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const currentUser = async (req, res, next) => {
  // Check if authorization header is a bearer token
  if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // need to check keycloak, ensure the bearer token is valid
    const token = req.headers.authorization.substring(7);
    const ok = await keycloak.grantManager.validateAccessToken(token);
    if (!ok) {
      return new Problem(403, { detail: 'Authorization token is invalid.' }).send(res);
    }
  }

  return setUser(req, res, next);
};

const _getForm = async (currentUser, formId) => {
  const forms = await service.getUserForms(currentUser, { active: true, formId: formId });
  let form = forms.find((f) => f.formId === formId);

  if (!form) {
    const deletedForms = await service.getUserForms(currentUser, { active: false, formId: formId });
    form = deletedForms.find((f) => f.formId === formId);
  }

  return form;
};

const hasFormPermissions = (permissions) => {
  return async (req, res, next) => {
    // Skip permission checks if requesting as API entity
    if (req.apiUser) {
      return next();
    }

    if (!req.currentUser) {
      // cannot find the currentUser... guess we don't have access... FAIL!
      return new Problem(401, { detail: 'Current user not found on request.' }).send(res);
    }
    // If we invoke this middleware and the caller is acting on a specific formId, whether in a param or query (precedence to param)
    const formId = req.params.formId || req.query.formId;
    if (!formId) {
      // No form provided to this route that secures based on form... that's a problem!
      return new Problem(401, { detail: 'Form Id not found on request.' }).send(res);
    }
    let form = await _getForm(req.currentUser, formId);
    if (!form) {
      // cannot find the form... guess we don't have access... FAIL!
      return new Problem(401, { detail: 'Current user has no access to form.' }).send(res);
    }

    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }

    const intersection = permissions.filter((p) => {
      return form.permissions.includes(p);
    });

    if (intersection.length !== permissions.length) {
      return new Problem(401, { detail: 'Current user does not have required permission(s) on form' }).send(res);
    } else {
      return next();
    }
  };
};

const hasSubmissionPermissions = (permissions) => {
  return async (req, _res, next) => {
    try {
      // Skip permission checks if requesting as API entity
      if (req.apiUser) {
        return next();
      }

      if (!Array.isArray(permissions)) {
        permissions = [permissions];
      }

      // Get the provided submission ID whether in a param or query (precedence to param)
      const submissionId = req.params.formSubmissionId || req.query.formSubmissionId;
      if (!submissionId) {
        // No submission provided to this route that secures based on form... that's a problem!
        return next(new Problem(401, { detail: 'Submission Id not found on request.' }));
      }

      // Get the submission results so we know what form this submission is for
      const submissionForm = await service.getSubmissionForm(submissionId);

      // Does the user have permissions for this submission due to their FORM permissions
      if (req.currentUser) {
        const forms = await service.getUserForms(req.currentUser, { active: true, formId: submissionForm.form.id });
        let formFromCurrentUser = forms.find((f) => f.formId === submissionForm.form.id);
        if (formFromCurrentUser) {
          // Do they have the submission permissions being requested on this FORM
          const intersection = permissions.filter((p) => {
            return formFromCurrentUser.permissions.includes(p);
          });
          if (intersection.length === permissions.length) {
            req.formIdWithDeletePermission = submissionForm.form.id;
            return next();
          }
        }
      }

      // Deleted submissions are inaccessible
      if (submissionForm.submission.deleted) {
        return next(new Problem(401, { detail: 'You do not have access to this submission.' }));
      }

      // TODO: consider whether DRAFT submissions are restricted as deleted above

      // Public (annonymous) forms are publicly viewable
      const publicAllowed = submissionForm.form.identityProviders.find((p) => p.code === 'public') !== undefined;
      if (permissions.length === 1 && permissions.includes(Permissions.SUBMISSION_READ) && publicAllowed) {
        return next();
      }

      // check against the submission level permissions assigned to the user...
      const submissionPermission = await service.checkSubmissionPermission(req.currentUser, submissionId, permissions);
      if (submissionPermission) return next();

      // no access to this submission...
      return next(new Problem(401, { detail: 'You do not have access to this submission.' }));
    } catch (error) {
      next(error);
    }
  };
};

const filterMultipleSubmissions = () => {
  return async (req, _res, next) => {
    try {
      // Get the provided list of submissions Id whether in a req body
      const submissionIds = req.body && req.body.submissionIds;
      if (!Array.isArray(submissionIds)) {
        // No submission provided to this route that secures based on form... that's a problem!
        return next(new Problem(401, { detail: 'SubmissionIds not found on request.' }));
      }

      let formIdWithDeletePermission = req.formIdWithDeletePermission;

      // Get the provided form ID whether in a param or query (precedence to param)
      const formId = req.params.formId || req.query.formId;
      if (!formId) {
        // No submission provided to this route that secures based on form... that's a problem!
        return next(new Problem(401, { detail: 'Form Id not found on request.' }));
      }

      //validate form id
      if (!validate(formId)) {
        return next(new Problem(401, { detail: 'Not a valid form id' }));
      }

      //validate all submission ids
      const isValidSubmissionId = submissionIds.every((submissionId) => validate(submissionId));
      if (!isValidSubmissionId) {
        return next(new Problem(401, { detail: 'Invalid submissionId(s) in the submissionIds list.' }));
      }

      if (formIdWithDeletePermission === formId) {
        // check if users has not injected submission id that does not belong to this form
        const metaData = await service.getMultipleSubmission(submissionIds);

        const isForeignSubmissionId = metaData.every((SubmissionMetadata) => SubmissionMetadata.formId === formId);
        if (!isForeignSubmissionId || metaData.length !== submissionIds.length) {
          return next(new Problem(401, { detail: 'Current user does not have required permission(s) for some submissions in the submissionIds list.' }));
        }
        return next();
      }
      return next(new Problem(401, { detail: 'Current user does not have required permission(s) for to delete submissions' }));
    } catch (error) {
      next(error);
    }
  };
};

const hasFormRole = async (formId, user, role) => {
  let hasRole = false;

  const forms = await service.getUserForms(user, { active: true, formId: formId });
  const form = forms.find((f) => f.formId === formId);

  if (form) {
    for (let j = 0; j < form.roles.length; j++) {
      if (form.roles[j] === role) {
        hasRole = true;
        break;
      }
    }
  }

  return hasRole;
};

const hasFormRoles = (formRoles, hasAll = false) => {
  return async (req, res, next) => {
    // If we invoke this middleware and the caller is acting on a specific formId, whether in a param or query (precedence to param)
    const formId = req.params.formId || req.query.formId;
    if (!formId) {
      // No form provided to this route that secures based on form... that's a problem!
      return new Problem(401, { detail: 'Form Id not found on request.' }).send(res);
    }

    const forms = await service.getUserForms(req.currentUser, { active: true, formId: formId });
    const form = forms.find((f) => f.formId === formId);
    if (form) {
      for (let roleIndex = 0; roleIndex < form.roles.length; roleIndex++) {
        let index = formRoles.indexOf(form.roles[roleIndex]);
        // If the user has the indexed role requested by the route
        if (index > -1) {
          // If the route specifies all roles must exist for the form
          if (hasAll)
            // Remove that role from the search
            formRoles.splice(index, 1);
          // The user has at least one of the roles
          else return next();
        }
        // The user has all of the required roles
        if (formRoles.length == 0) break;
      }
    }

    if (hasAll) {
      if (formRoles.length > 0) return next(new Problem(401, { detail: 'You do not have permission to update this role.' }));
      else return next();
    }
    return next(new Problem(401, { detail: 'You do not have permission to update this role.' }));
  };
};

const hasRolePermissions = (removingUsers = false) => {
  return async (req, res, next) => {
    try {
      // If we invoke this middleware and the caller is acting on a specific formId, whether in a param or query (precedence to param)
      const formId = req.params.formId || req.query.formId;
      if (!formId) {
        // No form provided to this route that secures based on form... that's a problem!
        return new Problem(401, { detail: 'Form Id not found on request.' }).send(res);
      }

      const currentUser = req.currentUser;
      const data = req.body;

      const isOwner = await hasFormRole(formId, currentUser, Roles.OWNER);

      if (removingUsers) {
        if (data.includes(currentUser.id)) return next(new Problem(401, { detail: "You can't remove yourself from this form." }));

        if (!isOwner) {
          for (let i = 0; i < data.length; i++) {
            let userId = data[i];

            const userRoles = await rbacService.readUserRole(userId, formId);

            // Can't update another user's roles if they are an owner
            if (userRoles.some((fru) => fru.role === Roles.OWNER) && userId !== currentUser.id) {
              return next(new Problem(401, { detail: "You can not update an owner's roles." }));
            }

            // If the user is trying to remove the designer role
            if (userRoles.some((fru) => fru.role === Roles.FORM_DESIGNER)) {
              return next(new Problem(401, { detail: "You can't remove a form designer role." }));
            }
          }
        }
      } else {
        const userId = req.params.userId || req.query.userId;
        if (!userId || (userId && userId.length === 0)) {
          return new Problem(401, { detail: 'User Id not found on request.' });
        }

        if (!isOwner) {
          const userRoles = await rbacService.readUserRole(userId, formId);

          // If the user is trying to remove the team manager role for their own userid
          if (userRoles.some((fru) => fru.role === Roles.TEAM_MANAGER) && !data.some((role) => role.role === Roles.TEAM_MANAGER) && userId == currentUser.id) {
            return next(new Problem(401, { detail: "You can't remove your own team manager role." }));
          }

          // Can't update another user's roles if they are an owner
          if (userRoles.some((fru) => fru.role === Roles.OWNER) && userId !== currentUser.id) {
            return next(new Problem(401, { detail: "You can't update an owner's roles." }));
          }
          if (!userRoles.some((fru) => fru.role === Roles.OWNER) && data.some((role) => role.role === Roles.OWNER)) {
            return next(new Problem(401, { detail: "You can't add an owner role." }));
          }

          // If the user is trying to remove the designer role for another userid
          if (userRoles.some((fru) => fru.role === Roles.FORM_DESIGNER) && !data.some((role) => role.role === Roles.FORM_DESIGNER)) {
            return next(new Problem(401, { detail: "You can't remove a form designer role." }));
          }
          if (!userRoles.some((fru) => fru.role === Roles.FORM_DESIGNER) && data.some((role) => role.role === Roles.FORM_DESIGNER)) {
            return next(new Problem(401, { detail: "You can't add a form designer role." }));
          }
        }
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  checkFormVersionDraftId,
  checkFormVersionId,
  currentUser,
  hasFormPermissions,
  hasSubmissionPermissions,
  hasFormRoles,
  hasFormRole,
  hasRolePermissions,
  filterMultipleSubmissions,
};
