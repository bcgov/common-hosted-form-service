const Problem = require('api-problem');

const hasSubmissionPermissions = require('../../auth/middleware/userAccess').hasSubmissionPermissions;
const service = require('../service');


// Get the DB record for this file being accessed and store in request for use further down the chain
const currentFileRecord = async (req, res, next) => {
  let fileRecord = undefined;
  try {
    // Check if authed, can expand for API key access if needed
    if (req.params.id && req.currentUser) {
      fileRecord = await service.read(req.params.id);
    }
  } catch (NotFoundError) {
    return next(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
  }
  if (req.params.id && req.currentUser) {
    fileRecord = await service.read(req.params.id);
  }
  if (!fileRecord) {
    // 403 on no auth or file not found (don't 404 for id discovery)
    return next(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
  }

  req.currentFileRecord = fileRecord;
  next();
};

const hasFilePermissions = (permissions) => {
  return async (req, _res, next) => {
    if (!req.currentUser || !req.currentUser.keycloakId) {
      return next(new Problem(403, { detail: 'Unauthorized to read file' }));
    }

    if (req.currentFileRecord.formSubmissionId) {
      req.query.formSubmissionId = req.currentFileRecord.formSubmissionId;

      const subPermCheck = hasSubmissionPermissions(permissions);
      return subPermCheck(req, _res, next);
    } else {
      return next();
    }
  };
};

// Middleware to determine if this user can upload a file to the system
const hasFileCreate = (req, res, next) => {
  // You can't do this if you are not authenticated as a USER (not a public user)
  // Can expand on this for API key access if ever needed
  if (!req.currentUser || !req.currentUser.keycloakId) {
    return next(new Problem(403, { detail: 'Invalid authorization credentials.' }));
  }
  next();
};

module.exports.hasFileCreate = hasFileCreate;
module.exports.currentFileRecord = currentFileRecord;
module.exports.hasFilePermissions = hasFilePermissions;
