const Problem = require('api-problem');
const { NotFoundError } = require('objection');
const { validate: uuidValidate } = require('uuid');

const authService = require('../../auth/service');
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
const EMBED_UPLOADERS = new Set(['api-user', 'gateway-user', 'public-user']);

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

const FILE_CREATE_AUTH_REQUIRED = 'Authentication required for file uploads on this form';
const FILE_CREATE_NO_ACCESS = 'You do not have access to upload files to this form.';
const FILE_CREATE_NOT_PUBLISHED = 'This form is not accepting uploads.';

// Form permissions that let a signed-in user upload to a form: submitting to
// it, editing its submissions (staff edit), or designing it (preview).
const UPLOAD_PERMISSIONS = [Permissions.SUBMISSION_CREATE, Permissions.SUBMISSION_UPDATE, Permissions.DESIGN_CREATE, Permissions.DESIGN_UPDATE];
// Of those, the ones that also allow uploads while the form has no published
// version: editing existing submissions, and previewing a draft version.
const UNPUBLISHED_UPLOAD_PERMISSIONS = [Permissions.SUBMISSION_UPDATE, Permissions.DESIGN_CREATE, Permissions.DESIGN_UPDATE];

/**
 * @function decideFileCreate
 * Decides whether a caller may upload a file for an active form. Pure, no I/O.
 *
 * - Anonymous callers: the form must allow public submissions and have a
 *   published version.
 * - Signed-in callers who can update the submission they are editing (on
 *   this form): allowed, published or not. That covers draft owners, people a
 *   draft was shared with, and submitters asked to revise.
 * - Other signed-in callers: their access to the form must include one of
 *   UPLOAD_PERMISSIONS (submitters get submission_create on public forms and
 *   on login forms of their identity provider; team roles add the rest). A
 *   caller who can only submit also needs a published version.
 *
 * @param {object} args
 * @param {object} args.form the active form, with identityProviders and versions.
 * @param {boolean} args.signedIn true when the caller is signed in.
 * @param {string[]} [args.permissions] the signed-in caller's permissions on the form.
 * @param {boolean} [args.canUpdateSubmission] true when the signed-in caller can
 *   update the submission they are editing, and it is on this form.
 * @returns {null|{status: number, detail: string}} null when allowed, else the refusal.
 */
const decideFileCreate = ({ form, signedIn, permissions, canUpdateSubmission }) => {
  const published = (form.versions || []).some((version) => version.published);

  if (!signedIn) {
    if (!(form.identityProviders || []).some((idp) => idp.code === 'public')) {
      return { status: 403, detail: FILE_CREATE_AUTH_REQUIRED };
    }
    return published ? null : { status: 403, detail: FILE_CREATE_NOT_PUBLISHED };
  }

  if (canUpdateSubmission) {
    return null;
  }

  const granted = permissions || [];
  if (!UPLOAD_PERMISSIONS.some((permission) => granted.includes(permission))) {
    return { status: 403, detail: FILE_CREATE_NO_ACCESS };
  }
  if (!published && !UNPUBLISHED_UPLOAD_PERMISSIONS.some((permission) => granted.includes(permission))) {
    return { status: 403, detail: FILE_CREATE_NOT_PUBLISHED };
  }
  return null;
};

/**
 * Whether the user can update the submission, and it is a live submission on
 * the form: the same submission-level check a draft save uses (team access
 * to the form is already in the caller's form permissions).
 */
const canUpdateSubmissionOfForm = async (user, submissionId, formId) => {
  let submissionForm;
  try {
    submissionForm = await authService.getSubmissionForm(submissionId);
  } catch (error) {
    if (error instanceof NotFoundError) return false;
    throw error;
  }
  if (submissionForm.form.id !== formId || submissionForm.submission.deleted) return false;
  return !!(await authService.checkSubmissionPermission(user, submissionId, [Permissions.SUBMISSION_UPDATE]));
};

/**
 * @function hasFileCreate
 * Middleware to determine if the caller may upload a file for the form named
 * by the formId query parameter. The form must exist and be active; the rest
 * of the rules are in decideFileCreate. A signed-in caller's access is the
 * same per-form lookup hasFormPermissions uses. When that does not allow the
 * upload and the request names the submission being edited
 * (formSubmissionId), the caller's permission on that submission is checked.
 */
const hasFileCreate = async (req, res, next) => {
  try {
    const { formId, formSubmissionId } = req.query;

    if (!formId) {
      return next(new Problem(400, { detail: 'formId is required as query parameter for file uploads' }));
    }

    if (typeof formId !== 'string' || !uuidValidate(formId)) {
      return next(new Problem(400, { detail: 'formId must be a valid UUID' }));
    }

    if (formSubmissionId !== undefined && (typeof formSubmissionId !== 'string' || !uuidValidate(formSubmissionId))) {
      return next(new Problem(400, { detail: 'formSubmissionId must be a valid UUID' }));
    }

    // readForm only returns active forms and throws NotFoundError otherwise.
    const form = await formService.readForm(formId);

    const signedIn = !!req.currentUser?.idpUserId;
    let permissions;
    if (signedIn) {
      const forms = await authService.getUserForms(req.currentUser, { active: true, formId }, req.headers);
      permissions = forms.find((f) => f.formId === formId)?.permissions;
    }

    let refusal = decideFileCreate({ form, signedIn, permissions });
    if (refusal && signedIn && formSubmissionId && (await canUpdateSubmissionOfForm(req.currentUser, formSubmissionId, formId))) {
      refusal = decideFileCreate({ form, signedIn, permissions, canUpdateSubmission: true });
    }
    if (refusal) {
      return next(new Problem(refusal.status, { detail: refusal.detail }));
    }
    return next();
  } catch (error) {
    if (error instanceof NotFoundError) {
      return next(new Problem(404, { detail: 'Form not found' }));
    }
    if (error instanceof Problem) {
      return next(error);
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
  decideFileCreate,
  decideFileDelete,
  decideFileRead,
  hasFileCreate,
  hasFileDelete,
  hasFileRead,
  restrictsFileDownloads,
};
