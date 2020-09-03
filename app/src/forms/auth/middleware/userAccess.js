const Problem = require('api-problem');
const service = require('../service');

const getToken = req => {
  try {
    return req.kauth.grant.access_token;
  } catch (err) {
    return null;
  }
};

const currentUser = async (req, res, next) => {
  const token = getToken(req);
  req.currentUser = await service.login(token);
  next();
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
    const form = req.currentUser.forms.find(f => f.formId === formId);
    if (!form) {
      // cannot find the form... guess we don't have access... FAIL!
      return next(new Problem(401, {detail: 'Current user has no access to form.'}));
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
