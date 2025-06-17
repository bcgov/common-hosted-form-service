const Problem = require('api-problem');

const userAccess = require('../../auth/middleware/userAccess');
const log = require('../../../components/log')(module.filename);
const service = require('../service');
const formService = require('../../form/service');
const { Permissions } = require('../../common/constants');

/**
 * @function currentFileRecord
 * Get the DB record for this file being accessed and store in request for use further down the chain
 * @returns {Function} a middleware function
 */
const currentFileRecord = async (req, _res, next) => {
  let fileRecord;
  try {
    // Check if authed, can expand for API key access if needed
    if (req.params.fileId && (req.currentUser || req.apiUser)) {
      // expanded for api user
      fileRecord = await service.read(req.params.fileId);
    }
  } catch (error) {
    log.error(`Failed to find file record for id ${req.params.fileId}. Error ${error}`);
  }

  if (!fileRecord) {
    // 403 on no auth or file not found (don't 404 for id discovery)
    return next(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
  }

  req.currentFileRecord = fileRecord;
  next();
};

/**
 * @function hasFileCreate
 * Middleware to determine if this user can upload a file to the system
 * Allows authenticated users always, and public users for public forms
 * @returns {Function} a middleware function
 */
const hasFileCreate = async (req, res, next) => {
  try {
    // If authenticated user, always allow
    if (req.currentUser && req.currentUser.idpUserId) {
      return next();
    }

    // For public users, check if they can upload to this form
    const formId = req.query.formId;

    if (!formId) {
      return next(new Problem(400, { detail: 'formId is required as query parameter for file uploads' }));
    }

    // Get form configuration with identity providers
    const form = await formService.readForm(formId);
    if (!form) {
      return next(new Problem(404, { detail: 'Form not found' }));
    }

    // Check if form is active
    if (!form.active) {
      return next(new Problem(403, { detail: 'Form is not active' }));
    }

    // Check if form allows public access - using the exact same logic as userAccess.js
    const publicAllowed = form.identityProviders.find((p) => p.code === 'public') !== undefined;

    if (!publicAllowed) {
      return next(new Problem(403, { detail: 'Authentication required for file uploads on this form' }));
    }

    // If we get here: public user + public form = allow upload
    return next();
  } catch (error) {
    log.error('Error in hasFileCreate middleware:', error);
    return next(new Problem(500, { detail: 'Unable to upload file at this time. Please try again later.' }));
  }
};

/**
 * @function hasFileDelete
 * Middleware to determine if this user can delete an array of files from the system
 * @returns {Function} a middleware function
 */
const hasFileDelete = async (req, res, next) => {
  // You can't do this if you are not authenticated as a USER (not a public user)
  // Can expand on this for API key access if ever needed
  if (!req.currentUser || !req.currentUser.idpUserId) {
    return next(new Problem(403, { detail: 'Invalid authorization credentials.' }));
  }

  const fileIds = req.body.fileIds;

  if (!Array.isArray(fileIds)) {
    return next(new Problem(403, { detail: 'File IDs must be an array of file UUIDs.' }));
  }

  let fileNotFound = false;
  let permissionError = null;
  for (const fileId of fileIds) {
    const fileRecord = await service.read(fileId);
    if (!fileRecord) {
      fileNotFound = true;
      break;
    } else {
      req.currentFileRecord = fileRecord;
      req.query.formSubmissionId = req.currentFileRecord.formSubmissionId;
      const subPermCheck = userAccess.hasSubmissionPermissions([Permissions.SUBMISSION_UPDATE]);
      await subPermCheck(req, res, (err) => {
        if (err) {
          permissionError = err;
        }
      });
      if (permissionError) {
        break;
      }
    }
  }

  if (fileNotFound) {
    // 403 on no auth or file not found (don't 404 for id discovery)
    return next(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
  }

  if (permissionError) {
    return next(permissionError);
  }

  next();
};

/**
 * @function hasFilePermissions
 * Middleware to determine if the current user can do a specific permission on a file
 * This is generally based on the SUBMISSION permissions that the file is attached to
 * but has to handle management for files that are added before submit
 * @param {string[]} permissions the submission permissions to require on this route
 * @returns {Function} a middleware function
 */
const hasFilePermissions = (permissions) => {
  return (req, res, next) => {
    // skip for API users
    if (req.apiUser) {
      return next();
    }
    // Guard against unauthed (or public) users
    if (!req.currentUser || !req.currentUser.idpUserId) {
      return next(new Problem(403, { detail: 'Unauthorized to read file.' }));
    }

    // Check to see if this has been associated with a submission...
    // like prior implementations, if a submission has not been posted, there's not
    // anything we can check permissions on so can only check authed
    if (req.currentFileRecord.formSubmissionId) {
      // For the existing middleware to interface as designed, add the sub ID to the req
      req.query.formSubmissionId = req.currentFileRecord.formSubmissionId;

      // Trigger submission permission checker
      const subPermCheck = userAccess.hasSubmissionPermissions(permissions);
      return subPermCheck(req, res, next);
    }

    next();
  };
};

module.exports = {
  currentFileRecord,
  hasFileCreate,
  hasFileDelete,
  hasFilePermissions,
};
