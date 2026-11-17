const Problem = require('api-problem');
const { NotFoundError } = require('objection');
const { validate: uuidValidate } = require('uuid');

const userAccess = require('../../auth/middleware/userAccess');
const idpService = require('../../../components/idpService');
const log = require('../../../components/log')(module.filename);
const service = require('../service');
const formService = require('../../form/service');
const { Permissions, SystemUsers } = require('../../common/constants');

const FILE_READ_DENIED = 'Unauthorized to read file.';
const FILE_DELETE_DENIED = 'Unauthorized to delete file.';

const FILE_READ = Object.freeze({
  ALLOW: 'allow',
  DENY: 'deny',
  PACKAGE: 'package',
  SUBMISSION: 'submission',
});

const FILE_DELETE = Object.freeze({
  ALLOW: 'allow',
  DENY: 'deny',
  SUBMISSION: 'submission',
});

// createdBy of an anonymous upload (file/service.js create).
const PUBLIC_UPLOADER = 'public';

// createdBy of uploads made through the webcomponents routes (the seeded
// runtime-auth users); those are managed on the webcomponents routes.
const EMBED_UPLOADERS = new Set(['api-user', 'gateway-user']);

/**
 * True when the identity provider is treated as public for file access
 * (`extra.restrictFileDownloads`), for example because its accounts can be
 * created in bulk.
 *
 * @param {object} idp the identity provider row.
 * @returns {boolean}
 */
const restrictsFileDownloads = (idp) => idp?.extra?.restrictFileDownloads === true;

/**
 * True when the identity provider gives every user the same username: its
 * tokenmap maps `username` to a constant with the `::raw` routine, or does not
 * map it at all (every user then keeps the default `public`). A createdBy value
 * from such a provider does not identify one user.
 *
 * @param {object} idp the identity provider row.
 * @returns {boolean}
 */
const sharesUsername = (idp) => {
  const mapping = idp?.tokenmap?.username;
  return typeof mapping !== 'string' || mapping === '' || mapping.endsWith('::raw');
};

/**
 * @function decideFileRead
 * Decides whether a caller may read a file. Pure, no I/O.
 *
 * A requested submission id (a formSubmissionId query parameter) that is not
 * the file's own submission is denied: the submission permission check would
 * otherwise test the caller against that submission instead of the file's.
 *
 * Callers with no session, with no identity provider row, or from a provider
 * with extra.restrictFileDownloads are public-like.
 *
 * Attached files (formSubmissionId set): API key callers are allowed,
 * public-like callers are denied, everyone else is checked against the
 * submission permissions.
 *
 * Unattached files: built submission packages are open to anyone, subject to
 * a package job lookup. Otherwise only the signed-in creator may read, and
 * only when createdBy identifies one user.
 *
 * @param {object} args
 * @param {object} args.file the file_storage row.
 * @param {boolean} args.apiUser true when the request passed form API key auth.
 * @param {object} args.user the current user; the public user when not signed in.
 * @param {object} [args.idp] the identity provider row for the current user.
 * @param {*} [args.requestedSubmissionId] the formSubmissionId query parameter, if sent.
 * @returns {string} one of FILE_READ.
 */
const decideFileRead = ({ file, apiUser, user, idp, requestedSubmissionId }) => {
  if (requestedSubmissionId !== undefined && requestedSubmissionId !== file.formSubmissionId) return FILE_READ.DENY;

  const publicLike = !user?.idpUserId || !idp || restrictsFileDownloads(idp);

  if (file.formSubmissionId) {
    if (apiUser) return FILE_READ.ALLOW;
    if (publicLike) return FILE_READ.DENY;
    return FILE_READ.SUBMISSION;
  }

  if (file.updatedBy === SystemUsers.SUBMISSION_PACKAGE_WORKER) return FILE_READ.PACKAGE;
  if (apiUser || publicLike || sharesUsername(idp)) return FILE_READ.DENY;
  return user.usernameIdp && file.createdBy === user.usernameIdp ? FILE_READ.ALLOW : FILE_READ.DENY;
};

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

    if (typeof formId !== 'string' || !uuidValidate(formId)) {
      return next(new Problem(400, { detail: 'formId must be a valid UUID' }));
    }

    // Get form configuration with identity providers. readForm only returns
    // active forms and throws NotFoundError otherwise.
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
    if (error instanceof NotFoundError) {
      return next(new Problem(404, { detail: 'Form not found' }));
    }
    log.error('Error in hasFileCreate middleware:', error);
    return next(new Problem(500, { detail: 'Unable to upload file at this time. Please try again later.' }));
  }
};

/**
 * @function decideFileDelete
 * Decides whether a caller may delete a file. Pure, no I/O.
 *
 * A requested submission id (a formSubmissionId query parameter) that is not
 * the file's own submission is denied, as for reads.
 *
 * Attached files: API key callers are allowed (apiAccess has matched the key
 * to the file's form), anonymous callers are denied, everyone else is checked
 * against SUBMISSION_UPDATE on the file's submission.
 *
 * Unattached files: submission packages and webcomponents uploads cannot be
 * deleted here, nor by API key callers. Anonymous uploads (createdBy public)
 * have no uploader to check and may be deleted by anyone, which keeps
 * remove-before-submit working; ids are random. Any other upload only by the
 * signed-in user whose usernameIdp is its createdBy. A createdBy that many
 * users share (the BC Services Card anonymous username) matches any of them,
 * as an anonymous upload matches anyone.
 *
 * @param {object} args
 * @param {object} args.file the file_storage row.
 * @param {boolean} args.apiUser true when the request passed form API key auth.
 * @param {object} args.user the current user; the public user when not signed in.
 * @param {*} [args.requestedSubmissionId] the formSubmissionId query parameter, if sent.
 * @returns {string} one of FILE_DELETE.
 */
const decideFileDelete = ({ file, apiUser, user, requestedSubmissionId }) => {
  if (requestedSubmissionId !== undefined && requestedSubmissionId !== file.formSubmissionId) return FILE_DELETE.DENY;

  if (file.formSubmissionId) {
    if (apiUser) return FILE_DELETE.ALLOW;
    if (!user?.idpUserId) return FILE_DELETE.DENY;
    return FILE_DELETE.SUBMISSION;
  }

  if (file.updatedBy === SystemUsers.SUBMISSION_PACKAGE_WORKER) return FILE_DELETE.DENY;
  if (apiUser || EMBED_UPLOADERS.has(file.createdBy)) return FILE_DELETE.DENY;
  if (file.createdBy === PUBLIC_UPLOADER) return FILE_DELETE.ALLOW;
  return user?.idpUserId && user.usernameIdp && file.createdBy === user.usernameIdp ? FILE_DELETE.ALLOW : FILE_DELETE.DENY;
};

/**
 * @function hasFileDelete
 * Middleware to determine if the current caller can delete the file in
 * req.currentFileRecord. The rules are in decideFileDelete.
 */
const hasFileDelete = async (req, res, next) => {
  try {
    const decision = decideFileDelete({
      file: req.currentFileRecord,
      apiUser: !!req.apiUser,
      user: req.currentUser,
      requestedSubmissionId: req.query?.formSubmissionId,
    });

    if (decision === FILE_DELETE.ALLOW) {
      return next();
    }

    if (decision === FILE_DELETE.SUBMISSION) {
      return userAccess.hasSubmissionPermissions([Permissions.SUBMISSION_UPDATE])(req, res, next);
    }

    return next(new Problem(403, { detail: FILE_DELETE_DENIED }));
  } catch (error) {
    return next(error);
  }
};

/**
 * @function hasFileRead
 * Middleware to determine if the current caller can read the file in
 * req.currentFileRecord. The rules are in decideFileRead.
 */
const hasFileRead = async (req, res, next) => {
  try {
    const file = req.currentFileRecord;
    const user = req.currentUser;
    const idp = user?.idp ? await idpService.findByCode(user.idp) : undefined;
    const decision = decideFileRead({ file, apiUser: !!req.apiUser, user, idp, requestedSubmissionId: req.query?.formSubmissionId });

    if (decision === FILE_READ.ALLOW) {
      return next();
    }

    if (decision === FILE_READ.SUBMISSION) {
      return userAccess.hasSubmissionPermissions([Permissions.SUBMISSION_READ])(req, res, next);
    }

    if (decision === FILE_READ.PACKAGE && (await service.isPackageFile(file.id))) {
      return next();
    }

    return next(new Problem(403, { detail: FILE_READ_DENIED }));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  FILE_DELETE,
  FILE_READ,
  currentFileRecord,
  decideFileDelete,
  decideFileRead,
  hasFileCreate,
  hasFileDelete,
  hasFileRead,
  restrictsFileDownloads,
};
