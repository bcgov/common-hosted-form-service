const Problem = require('api-problem');
const uuid = require('uuid');

const keycloak = require('../../../components/keycloak');
const Permissions = require('../../common/constants').Permissions;
const Roles = require('../../common/constants').Roles;
const service = require('../service');
const rbacService = require('../../rbac/service');

/**
 * Checks that every permission is in the user's form permissions.
 *
 * @param {*} form the user's form metadata including permissions.
 * @param {string[]} permissions the permissions needed for access.
 * @returns true if every permissions value is in the user's form permissions.
 */
const _formHasPermissions = (form, permissions) => {
  // Get the intersection of the two sets of permissions. If it's the same
  // size as permissions then the user has all the needed permissions.
  const intersection = permissions.filter((p) => {
    return form.permissions.includes(p);
  });

  return intersection.length === permissions.length;
};

/**
 * Gets the access token, if it exists, from the request.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @returns a string that is the access token, or undefined if it doesn't exist.
 */
const _getAccessToken = (req) => {
  return req.kauth?.grant?.access_token;
};

/**
 * Gets the bearer token, if it exists, from the request.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @returns a string that is the bearer token, or undefined if it doesn't exist.
 */
const _getBearerToken = (req) => {
  const authorization = req.headers?.authorization;

  let token;
  if (authorization && authorization.startsWith('Bearer ')) {
    token = authorization.substring(7);
  }

  return token;
};

/**
 * Gets the form metadata for the given formId from the forms available to the
 * current user.
 *
 * @param {*} currentUser the user that is currently logged in; may be public.
 * @param {uuid} formId the ID of the form to retrieve for the current user.
 * @param {boolean} includeDeleted if active form not found, look for a deleted
 *   form.
 * @returns the form metadata.
 * @throws Problem if the form metadata for the formId cannot be retrieved.
 */
const _getForm = async (currentUser, formId, includeDeleted) => {
  if (!uuid.validate(formId)) {
    throw new Problem(400, { detail: 'Bad formId' });
  }

  const forms = await service.getUserForms(currentUser, { active: true, formId: formId });
  let form = forms.find((f) => f.formId === formId);

  if (!form && includeDeleted) {
    const deletedForms = await service.getUserForms(currentUser, { active: false, formId: formId });
    form = deletedForms.find((f) => f.formId === formId);
  }

  // Cannot find the form: either it doesn't exist or we don't have access.
  if (!form) {
    throw new Problem(401, { detail: 'Current user has no access to form' });
  }

  return form;
};

/**
 * Express middleware that adds the user information as the res.currentUser
 * attribute so that all downstream middleware and business logic can use it.
 *
 * This will fall through if everything is OK. If the Bearer auth is not valid,
 * this will produce a 403 error.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 */
const currentUser = async (req, _res, next) => {
  try {
    // Validate bearer tokens before anything else - failure means no access.
    const bearerToken = _getBearerToken(req);
    if (bearerToken) {
      const ok = await keycloak.grantManager.validateAccessToken(bearerToken);
      if (!ok) {
        throw new Problem(403, { detail: 'Authorization token is invalid.' });
      }
    }

    // Add the request element that contains the current user's parsed info. It
    // is ok if the access token isn't defined: then we'll have a public user.
    const accessToken = _getAccessToken(req);
    req.currentUser = await service.login(accessToken);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware to check that a user has all the given permissions for a
 * form. This will fall through if everything is OK, otherwise it will call
 * next() with a Problem that describes the error.
 *
 * @param {string[]} permissions the form permissions that the user must have.
 * @returns nothing
 */
const hasFormPermissions = (permissions) => {
  return async (req, _res, next) => {
    try {
      // Skip permission checks if req is already validated using an API key.
      if (req.apiUser) {
        next();

        return;
      }

      // If the currentUser does not exist it means that the route is not set up
      // correctly - the currentUser middleware must be called before this
      // middleware.
      if (!req.currentUser) {
        throw new Problem(500, {
          detail: 'Current user not found on request',
        });
      }

      // The request must include a formId, either in params or query, but give
      // precedence to params.
      const form = await _getForm(req.currentUser, req.params.formId || req.query.formId, true);

      if (!_formHasPermissions(form, permissions)) {
        throw new Problem(401, {
          detail: 'Current user does not have required permission(s) on form',
        });
      }

      next();
    } catch (error) {
      next(error);
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
      if (!uuid.validate(formId)) {
        return next(new Problem(401, { detail: 'Not a valid form id' }));
      }

      //validate all submission ids
      const isValidSubmissionId = submissionIds.every((submissionId) => uuid.validate(submissionId));
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
  currentUser,
  hasFormPermissions,
  hasSubmissionPermissions,
  hasFormRoles,
  hasFormRole,
  hasRolePermissions,
  filterMultipleSubmissions,
};
