const Problem = require('api-problem');
const uuid = require('uuid');

const jwtService = require('../../../components/jwtService');
const Permissions = require('../../common/constants').Permissions;
const Roles = require('../../common/constants').Roles;
const service = require('../service');
const rbacService = require('../../rbac/service');

/**
 * Gets the form metadata for the given formId from the forms available to the
 * current user.
 *
 * @param {*} currentUser the user that is currently logged in; may be public.
 * @param {uuid} formId the ID of the form to retrieve for the current user.
 * @param {boolean} includeDeleted if active form not found, look for a deleted
 *   form.
 * @returns the form metadata if the currentUser has access, or undefined.
 */
const _getForm = async (currentUser, formId, includeDeleted) => {
  if (!uuid.validate(formId)) {
    throw new Problem(400, {
      detail: 'Bad formId',
    });
  }

  const forms = await service.getUserForms(currentUser, {
    active: true,
    formId: formId,
  });
  let form = forms.find((f) => f.formId === formId);

  if (!form && includeDeleted) {
    const deletedForms = await service.getUserForms(currentUser, {
      active: false,
      formId: formId,
    });
    form = deletedForms.find((f) => f.formId === formId);
  }

  return form;
};

/**
 * Checks that the user's permissions contains every required permission.
 *
 * @param {string[]|undefined} userPermissions the permissions the user has.
 * @param {string[]} requiredPermissions the permissions needed for access.
 * @returns true if all required permissions are in the user permissions.
 */
const _hasAllPermissions = (userPermissions, requiredPermissions) => {
  // If there are no user permissions then the user can't have permission.
  if (!userPermissions) {
    return false;
  }

  // Get the intersection of the two sets of permissions.
  const intersection = requiredPermissions.filter((p) => {
    return userPermissions.includes(p);
  });

  // If the intersection is the same size as the required permissions then the
  // user has all the needed permissions.
  return intersection.length === requiredPermissions.length;
};

/**
 * Checks that the user's permissions contains any of the required permissions.
 *
 * @param {string[]|undefined} userPermissions the permissions the user has.
 * @param {string[]} requiredPermissions the permissions needed for access.
 * @returns true if any required permissions is in the user permissions.
 */
const _hasAnyPermission = (userPermissions, requiredPermissions) => {
  // If there are no user permissions then the user can't have permission.
  if (!userPermissions) {
    return false;
  }

  // Get the intersection of the two sets of permissions.
  const intersection = requiredPermissions.filter((p) => {
    return userPermissions.includes(p);
  });

  // If the intersection has any values then the user has permission.
  return intersection.length > 0;
};

/**
 * Express middleware that adds the user information as the res.currentUser
 * attribute so that all downstream middleware and business logic can use it.
 * This falls through if everything is OK, otherwise it calls next() with a
 * Problem describing the error.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @returns nothing
 */
const currentUser = async (req, _res, next) => {
  try {
    // Validate bearer tokens before anything else - failure means no access.
    const bearerToken = jwtService.getBearerToken(req);
    if (bearerToken) {
      const ok = await jwtService.validateAccessToken(bearerToken);
      if (!ok) {
        throw new Problem(401, {
          detail: 'Authorization token is invalid.',
        });
      }
    }

    // Add the request element that contains the current user's parsed info. It
    // is ok if the access token isn't defined: then we'll have a public user.
    const accessToken = await jwtService.getTokenPayload(req);
    req.currentUser = await service.login(accessToken);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware that checks that a collection of submissions belong to a
 * given form that the user has delete permissions for. This falls through if
 * everything is OK, otherwise it calls next() with a Problem describing the
 * error.
 *
 * This could use some refactoring to move the formIdWithDeletePermission
 * creation code into this function. That way there is no external dependency,
 * and the code will be easier to understand.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @returns nothing
 */
const filterMultipleSubmissions = async (req, _res, next) => {
  try {
    // The request must include a formId, either in params or query, but give
    // precedence to params.
    const form = await _getForm(req.currentUser, req.params.formId || req.query.formId, true);

    // Get the array of submission IDs from the request body.
    const submissionIds = req.body && req.body.submissionIds;
    if (!Array.isArray(submissionIds)) {
      throw new Problem(401, {
        detail: 'SubmissionIds not found on request.',
      });
    }

    // Check that all submission IDs are valid UUIDs.
    const isValidSubmissionId = submissionIds.every((submissionId) => uuid.validate(submissionId));
    if (!isValidSubmissionId) {
      throw new Problem(401, {
        detail: 'Invalid submissionId(s) in the submissionIds list.',
      });
    }

    if (req.formIdWithDeletePermission === form.formId) {
      // check if users has not injected submission id that does not belong to this form
      const metaData = await service.getMultipleSubmission(submissionIds);

      const isForeignSubmissionId = metaData.every((SubmissionMetadata) => SubmissionMetadata.formId === form.formId);
      if (!isForeignSubmissionId || metaData.length !== submissionIds.length) {
        throw new Problem(401, {
          detail: 'Current user does not have required permission(s) for some submissions in the submissionIds list.',
        });
      }

      return next();
    }

    throw new Problem(401, {
      detail: 'Current user does not have required permission(s) for to delete submissions',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware to check that a user has all the given permissions for a
 * form. This falls through if everything is OK, otherwise it calls next() with
 * a Problem describing the error.
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

      // If the form doesn't exist, or its permissions don't exist, then access
      // will be denied - otherwise check to see if permissions is a subset.
      if (!_hasAllPermissions(form?.permissions, permissions)) {
        throw new Problem(401, {
          detail: 'You do not have access to this form.',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Express middleware to check that the caller has one of the given roles for
 * the form identified by params.formId or query.formId. This falls through if
 * everything is OK, otherwise it calls next() with a Problem describing the
 * error.
 *
 * @param {string[]} roles the roles the user needs one of for the form.
 * @returns nothing
 */
const hasFormRoles = (roles) => {
  return async (req, _res, next) => {
    try {
      // The request must include a formId, either in params or query, but give
      // precedence to params.
      const form = await _getForm(req.currentUser, req.params.formId || req.query.formId, false);

      if (!_hasAnyPermission(form?.roles, roles)) {
        throw new Problem(401, {
          detail: 'You do not have permission to update this role.',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Express middleware to check that the calling user is allowed to delete roles
 * for the form identified by params.formId or query.formId. This falls through
 * if everything is OK, otherwise it calls next() with a Problem describing the
 * error.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @returns nothing
 */
const hasRoleDeletePermissions = async (req, _res, next) => {
  try {
    const currentUser = req.currentUser;

    // The request must include a formId, either in params or query, but give
    // precedence to params.
    const form = await _getForm(currentUser, req.params.formId || req.query.formId, false);

    const userIds = req.body;
    if (userIds.includes(currentUser.id)) {
      throw new Problem(401, {
        detail: "You can't remove yourself from this form.",
      });
    }

    const isOwner = form.roles.includes(Roles.OWNER);
    if (!isOwner) {
      for (const userId of userIds) {
        if (!uuid.validate(userId)) {
          throw new Problem(400, {
            detail: 'Bad userId',
          });
        }

        // Convert to an array of role strings, rather than the objects.
        const userRoles = (await rbacService.readUserRole(userId, form.formId)).map((userRole) => userRole.role);

        // A non-owner can't delete an owner.
        if (userRoles.includes(Roles.OWNER) && userId !== currentUser.id) {
          throw new Problem(401, {
            detail: "You can not update an owner's roles.",
          });
        }

        // A non-owner can't delete a form designer.
        if (userRoles.includes(Roles.FORM_DESIGNER)) {
          throw new Problem(401, {
            detail: "You can't remove a form designer role.",
          });
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware to check that the calling user is allowed to modify roles
 * for the form identified by params.formId or query.formId. This falls through
 * if everything is OK, otherwise it calls next() with a Problem describing the
 * error.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 * @returns nothing
 */
const hasRoleModifyPermissions = async (req, _res, next) => {
  try {
    const currentUser = req.currentUser;

    // The request must include a formId, either in params or query, but give
    // precedence to params.
    const form = await _getForm(currentUser, req.params.formId || req.query.formId, false);

    const userId = req.params.userId || req.query.userId;
    if (!uuid.validate(userId)) {
      throw new Problem(400, {
        detail: 'Bad userId',
      });
    }

    const isOwner = form.roles.includes(Roles.OWNER);
    if (!isOwner) {
      // Convert to arrays of role strings, rather than the objects.
      const userRoles = (await rbacService.readUserRole(userId, form.formId)).map((userRole) => userRole.role);
      const futureRoles = req.body.map((userRole) => userRole.role);

      // If the user is trying to remove the team manager role for their own userid
      if (userRoles.includes(Roles.TEAM_MANAGER) && !futureRoles.includes(Roles.TEAM_MANAGER) && userId === currentUser.id) {
        throw new Problem(401, {
          detail: "You can't remove your own team manager role.",
        });
      }

      if (userRoles.includes(Roles.OWNER)) {
        // Can't remove a different user's owner role unless you are an owner.
        //
        // TODO: Remove this if statement and just throw the exception. It's not
        // possible for userId === currentUser.id since we're in an if that we
        // are !isOwner but also that userRoles.includes(Roles.OWNER).
        if (userId !== currentUser.id) {
          throw new Problem(401, {
            detail: "You can't update an owner's roles.",
          });
        }
      } else if (futureRoles.includes(Roles.OWNER)) {
        // Can't add an owner role unless you are an owner.
        throw new Problem(401, {
          detail: "You can't add an owner role.",
        });
      }

      if (userRoles.includes(Roles.FORM_DESIGNER)) {
        // Can't remove form designer if you are not an owner.
        if (!futureRoles.includes(Roles.FORM_DESIGNER)) {
          throw new Problem(401, {
            detail: "You can't remove a form designer role.",
          });
        }
      } else if (futureRoles.includes(Roles.FORM_DESIGNER)) {
        // Can't add form designer if you are not an owner.
        throw new Problem(401, {
          detail: "You can't add a form designer role.",
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware to check that the caller has the given permissions for the
 * submission identified by params.formSubmissionId or query.formSubmissionId.
 * This falls through if everything is OK, otherwise it calls next() with a
 * Problem describing the error.
 *
 * @param {string[]} permissions the access the user needs for the submission.
 * @returns nothing
 */
const hasSubmissionPermissions = (permissions) => {
  return async (req, _res, next) => {
    try {
      // Skip permission checks if req is already authorized using an API key.
      if (req.apiUser) {
        next();

        return;
      }

      // The request must include a formSubmissionId, either in params or query,
      // but give precedence to params.
      const submissionId = req.params.formSubmissionId || req.query.formSubmissionId;
      if (!uuid.validate(submissionId)) {
        throw new Problem(400, {
          detail: 'Bad formSubmissionId',
        });
      }

      // Get the submission results so we know what form this submission is for.
      const submissionForm = await service.getSubmissionForm(submissionId);

      // If the current user has elevated permissions on the form, they may have
      // access to all submissions for the form.
      if (req.currentUser) {
        const formFromCurrentUser = await _getForm(req.currentUser, submissionForm.form.id, false);

        // Do they have the submission permissions requested on this form?
        if (_hasAllPermissions(formFromCurrentUser?.permissions, permissions)) {
          req.formIdWithDeletePermission = submissionForm.form.id;
          next();

          return;
        }
      }

      // Deleted submissions are only accessible to users with the form
      // permissions above.
      if (submissionForm.submission.deleted) {
        throw new Problem(401, {
          detail: 'You do not have access to this submission.',
        });
      }

      // Public (anonymous) forms are publicly viewable.
      const publicAllowed = submissionForm.form.identityProviders.find((p) => p.code === 'public') !== undefined;
      if (permissions.length === 1 && permissions.includes(Permissions.SUBMISSION_READ) && publicAllowed) {
        next();

        return;
      }

      // check against the submission level permissions assigned to the user...
      const submissionPermission = await service.checkSubmissionPermission(req.currentUser, submissionId, permissions);
      if (!submissionPermission) {
        throw new Problem(401, {
          detail: 'You do not have access to this submission.',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  currentUser,
  filterMultipleSubmissions,
  hasFormPermissions,
  hasFormRoles,
  hasRoleDeletePermissions,
  hasRoleModifyPermissions,
  hasSubmissionPermissions,
};
