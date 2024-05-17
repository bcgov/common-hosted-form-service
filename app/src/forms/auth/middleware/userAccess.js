const Problem = require('api-problem');
const uuid = require('uuid');

const jwtService = require('../../../components/jwtService');
const Permissions = require('../../common/constants').Permissions;
const Roles = require('../../common/constants').Roles;
const service = require('../service');
const rbacService = require('../../rbac/service');

/**
 * Checks that the user's permissions contains every required permission.
 *
 * @param {string[]} userPermissions the permissions that the user has.
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
 * @param {string[]} userPermissions the permissions that the user has.
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

const filterMultipleSubmissions = () => {
  return async (req, _res, next) => {
    try {
      // Get the provided list of submissions Id whether in a req body
      const submissionIds = req.body && req.body.submissionIds;
      if (!Array.isArray(submissionIds)) {
        // No submission provided to this route that secures based on form... that's a problem!
        throw new Problem(401, {
          detail: 'SubmissionIds not found on request.',
        });
      }

      let formIdWithDeletePermission = req.formIdWithDeletePermission;

      // Get the provided form ID whether in a param or query (precedence to param)
      const formId = req.params.formId || req.query.formId;
      if (!formId) {
        // No submission provided to this route that secures based on form... that's a problem!
        throw new Problem(401, {
          detail: 'Form Id not found on request.',
        });
      }

      //validate form id
      if (!uuid.validate(formId)) {
        throw new Problem(401, {
          detail: 'Not a valid form id',
        });
      }

      //validate all submission ids
      const isValidSubmissionId = submissionIds.every((submissionId) => uuid.validate(submissionId));
      if (!isValidSubmissionId) {
        throw new Problem(401, {
          detail: 'Invalid submissionId(s) in the submissionIds list.',
        });
      }

      if (formIdWithDeletePermission === formId) {
        // check if users has not injected submission id that does not belong to this form
        const metaData = await service.getMultipleSubmission(submissionIds);

        const isForeignSubmissionId = metaData.every((SubmissionMetadata) => SubmissionMetadata.formId === formId);
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
};

const _hasFormRole = async (formId, user, role) => {
  let hasRole = false;

  const forms = await service.getUserForms(user, {
    active: true,
    formId: formId,
  });
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

const hasRolePermissions = (removingUsers = false) => {
  return async (req, res, next) => {
    try {
      // If we invoke this middleware and the caller is acting on a specific formId, whether in a param or query (precedence to param)
      const formId = req.params.formId || req.query.formId;
      if (!formId) {
        // No form provided to this route that secures based on form... that's a problem!
        throw new Problem(401, {
          detail: 'Form Id not found on request.',
        });
      }

      const currentUser = req.currentUser;
      const data = req.body;

      const isOwner = await _hasFormRole(formId, currentUser, Roles.OWNER);

      if (removingUsers) {
        if (data.includes(currentUser.id))
          throw new Problem(401, {
            detail: "You can't remove yourself from this form.",
          });

        if (!isOwner) {
          for (let i = 0; i < data.length; i++) {
            let userId = data[i];

            const userRoles = await rbacService.readUserRole(userId, formId);

            // Can't update another user's roles if they are an owner
            if (userRoles.some((fru) => fru.role === Roles.OWNER) && userId !== currentUser.id) {
              throw new Problem(401, {
                detail: "You can not update an owner's roles.",
              });
            }

            // If the user is trying to remove the designer role
            if (userRoles.some((fru) => fru.role === Roles.FORM_DESIGNER)) {
              throw new Problem(401, {
                detail: "You can't remove a form designer role.",
              });
            }
          }
        }
      } else {
        const userId = req.params.userId || req.query.userId;
        if (!userId || (userId && userId.length === 0)) {
          throw new Problem(401, {
            detail: 'User Id not found on request.',
          });
        }

        if (!isOwner) {
          const userRoles = await rbacService.readUserRole(userId, formId);

          // If the user is trying to remove the team manager role for their own userid
          if (userRoles.some((fru) => fru.role === Roles.TEAM_MANAGER) && !data.some((role) => role.role === Roles.TEAM_MANAGER) && userId == currentUser.id) {
            throw new Problem(401, {
              detail: "You can't remove your own team manager role.",
            });
          }

          // Can't update another user's roles if they are an owner
          if (userRoles.some((fru) => fru.role === Roles.OWNER) && userId !== currentUser.id) {
            throw new Problem(401, {
              detail: "You can't update an owner's roles.",
            });
          }
          if (!userRoles.some((fru) => fru.role === Roles.OWNER) && data.some((role) => role.role === Roles.OWNER)) {
            throw new Problem(401, {
              detail: "You can't add an owner role.",
            });
          }

          // If the user is trying to remove the designer role for another userid
          if (userRoles.some((fru) => fru.role === Roles.FORM_DESIGNER) && !data.some((role) => role.role === Roles.FORM_DESIGNER)) {
            throw new Problem(401, {
              detail: "You can't remove a form designer role.",
            });
          }
          if (!userRoles.some((fru) => fru.role === Roles.FORM_DESIGNER) && data.some((role) => role.role === Roles.FORM_DESIGNER)) {
            throw new Problem(401, {
              detail: "You can't add a form designer role.",
            });
          }
        }
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
  hasRolePermissions,
  hasSubmissionPermissions,
};
