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
      return next(new Problem(403, {detail: 'Authorization token is invalid.'}));
    }
  }
  return setUser(request, response, next);
};

const hasFormPermissions = (permissions) => {
  return (req, res, next) => {

    if (!req.currentUser) {
      // cannot find the currentUser... guess we don't have access... FAIL!
      return next(new Problem(401, {detail: 'Current user not found on request.'}));
    }
    const formId = req.params.formId;
    if (!formId) {
      // cannot find the currentUser... guess we don't have access... FAIL!
      return next(new Problem(401, {detail: 'Form Id not found on request.'}));
    }
    let form = req.currentUser.forms.find(f => f.formId === formId);
    if (!form) {
      // check deleted... (this allows 404 on other queries later)
      form = req.currentUser.deletedForms.find(f => f.formId === formId);
      if (!form) {
        // cannot find the form... guess we don't have access... FAIL!
        return next(new Problem(401, {detail: 'Current user has no access to form.'}));
      }
    }

    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }

    const intersection = permissions.filter(p => {
      return form.permissions.includes(p);
    });

    if (intersection.length !== permissions.length) {
      return next(new Problem(401, {detail: 'Current user does not have required permission(s) on form'}));
    } else {
      return next();
    }
  };
};


module.exports.currentUser = currentUser;
module.exports.hasFormPermissions = hasFormPermissions;
