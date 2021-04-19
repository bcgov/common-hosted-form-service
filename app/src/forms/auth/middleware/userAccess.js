const Problem = require('api-problem');
const service = require('../service');
const keycloak = require('../../../components/keycloak');

const getToken = req => {
  try {
    return req.kauth.grant.access_token;
  } catch (err) {
    return null;
  }
};

const currentUser = async (request, response, next) => {

  const setUser = async (req, res, next) => {
    const token = getToken(req);
    // we can limit the form list from query string or url params.  Url params override query params
    // ex. /forms/:formId=ABC/version?formId=123
    // the ABC in the url will be used... so don't do that.
    const params = Object.assign({}, req.query, req.params);
    req.currentUser = await service.login(token, params);
    next();
  };

  if (request.headers && request.headers.authorization) {
    // need to check keycloak, ensure the authorization header is valid
    const token = request.headers.authorization.substring(7);
    const ok = await keycloak.grantManager.validateAccessToken(token);
    if (!ok) {
      return next(new Problem(403, { detail: 'Authorization token is invalid.' }));
    }
  }
  return setUser(request, response, next);
};

const hasFormPermissions = (permissions) => {
  return (req, res, next) => {

    if (!req.currentUser) {
      // cannot find the currentUser... guess we don't have access... FAIL!
      return next(new Problem(401, { detail: 'Current user not found on request.' }));
    }
    // If we invoke this middleware and the caller is acting on a specific formId, whether in a param or query (precedence to param)
    const formId = req.params.formId || req.query.formId;
    if (!formId) {
      // No form provided to this route that secures based on form... that's a problem!
      return next(new Problem(401, { detail: 'Form Id not found on request.' }));
    }
    let form = req.currentUser.forms.find(f => f.formId === formId);
    if (!form) {
      // check deleted... (this allows 404 on other queries later)
      if (req.currentUser.deletedForms) {
        form = req.currentUser.deletedForms.find(f => f.formId === formId);
      }
      if (!form) {
        // cannot find the form... guess we don't have access... FAIL!
        return next(new Problem(401, { detail: 'Current user has no access to form.' }));
      }
    }

    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }

    const intersection = permissions.filter(p => {
      return form.permissions.includes(p);
    });

    if (intersection.length !== permissions.length) {
      return next(new Problem(401, { detail: 'Current user does not have required permission(s) on form' }));
    } else {
      return next();
    }
  };
};

const hasSubmissionPermissions = async (permissions) => {
  return async (req, res, next) => {

    if (!req.currentUser) {
      // cannot find the currentUser... guess we don't have access... FAIL!
      return next(new Problem(401, { detail: 'Current user not found on request.' }));
    }
    // Get the provided submission ID whether in a param or query (precedence to param)
    const submissionId = req.params.submissionId || req.query.submissionId;
    if (!submissionId) {
      // No submission provided to this route that secures based on form... that's a problem!
      return next(new Problem(401, { detail: 'Submission Id not found on request.' }));
    }

    // Get the submission results so we know what form this submission is for
    const submissionForm = await service.getSubmissionForm(submissionId);

    // Does the user have permissions for this submission due to their FORM permissions
    let formFromCurrentUser = req.currentUser.forms.find(f => f.formId === submissionForm.form.id);
    if (formFromCurrentUser) {
      if (!Array.isArray(permissions)) {
        permissions = [permissions];
      }
      // Do they have the submission permissions being requested on this FORM
      const intersection = permissions.filter(p => {
        return formFromCurrentUser.permissions.includes(p);
      });
      if (intersection.length == permissions.length) {
        return next();
      }
    }

    const isDeleted = submissionForm.submission.deleted;
    const isDraft = submissionForm.submission.draft;
    const publicAllowed = submissionForm.form.identityProviders.find(p => p.code === 'public') !== undefined;
    const idpAllowed = submissionForm.form.identityProviders.find(p => p.code === currentUser.idp) !== undefined;

    // check against the public and user's identity provider permissions...
    if (!isDraft && !isDeleted) {
      if (publicAllowed || idpAllowed) return next();
    }

    // check against the submission level permissions assigned to the user...
    const submissionPermission = service.checkSubmissionPermission();
    if (submissionPermission) return next();

    // no access to this submission...
    return next(new Problem(401, { detail: 'You do not have access to this submission.' }));
  };
};



module.exports.currentUser = currentUser;
module.exports.hasFormPermissions = hasFormPermissions;
module.exports.hasSubmissionPermissions = hasSubmissionPermissions;
