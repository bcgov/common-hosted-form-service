const Problem = require('api-problem');

const keycloak = require('../../../components/keycloak');
const Permissions = require('../../common/constants').Permissions;
const service = require('../service');

const getToken = req => {
  try {
    return req.kauth.grant.access_token;
  } catch (err) {
    return null;
  }
};

const setUser = async (req, _res, next) => {
  const token = getToken(req);
  // we can limit the form list from query string or url params.  Url params override query params
  // ex. /forms/:formId=ABC/version?formId=123
  // the ABC in the url will be used... so don't do that.
  const params = { ...req.query, ...req.params };
  req.currentUser = await service.login(token, params);
  next();
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

const hasFormPermissions = (permissions) => {
  return (req, res, next) => {
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
    let form = req.currentUser.forms.find(f => f.formId === formId);
    if (!form) {
      // check deleted... (this allows 404 on other queries later)
      if (req.currentUser.deletedForms) {
        form = req.currentUser.deletedForms.find(f => f.formId === formId);
      }
      if (!form) {
        // cannot find the form... guess we don't have access... FAIL!
        return new Problem(401, { detail: 'Current user has no access to form.' }).send(res);
      }
    }

    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }

    const intersection = permissions.filter(p => {
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
      let formFromCurrentUser = req.currentUser.forms.find(f => f.formId === submissionForm.form.id);
      if (formFromCurrentUser) {

        // Do they have the submission permissions being requested on this FORM
        const intersection = permissions.filter(p => {
          return formFromCurrentUser.permissions.includes(p);
        });
        if (intersection.length === permissions.length) {
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
    const publicAllowed = submissionForm.form.identityProviders.find(p => p.code === 'public') !== undefined;
    if (permissions.length === 1 && permissions.includes(Permissions.SUBMISSION_READ) && publicAllowed) {
      return next();
    }

    // check against the submission level permissions assigned to the user...
    const submissionPermission = await service.checkSubmissionPermission(req.currentUser, submissionId, permissions);
    if (submissionPermission) return next();

    // no access to this submission...
    return next(new Problem(401, { detail: 'You do not have access to this submission.' }));
  };
};

module.exports = {
  currentUser, hasFormPermissions, hasSubmissionPermissions
};
