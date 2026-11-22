const Problem = require('api-problem');
const uuid = require('uuid');

const log = require('../../components/log')(module.filename);
const { SystemUsers } = require('../common/constants');

// Uploads by anonymous callers are stored with this createdBy, and anonymous
// callers and legacy form API key callers (Basic auth on the /forms and
// /submissions routes) have it as their usernameIdp. Webcomponents callers
// are their embed user instead (api-user, gateway-user, and public-user for
// anonymous embeds of Public forms).
const PUBLIC_UPLOADER = 'public';

const FILE_LINK = Object.freeze({ KEEP: 'keep', LEAVE: 'leave', LINK: 'link', REJECT: 'reject' });

const FILE_LINK_REJECTED = 'The submission names a file that cannot be attached to it.';

const isPackageFile = (file) => file.createdBy === SystemUsers.SUBMISSION_PACKAGE_WORKER || file.updatedBy === SystemUsers.SUBMISSION_PACKAGE_WORKER;

const submitterOf = (user) => user?.usernameIdp || PUBLIC_UPLOADER;

/**
 * @function normalizeFileIds
 * The file ids that submission data names, as the database stores them:
 * strings that are UUIDs, lowercased, each once. Anything else is not a file
 * id and is dropped.
 *
 * @param {*[]} ids the values found at data.id in the submission data.
 * @returns {string[]} the file ids.
 */
const normalizeFileIds = (ids) => [...new Set(ids.filter((id) => typeof id === 'string' && uuid.validate(id)).map((id) => id.toLowerCase()))];

/**
 * @function decideFileLink
 * Decides what happens to a file that saved submission data names. Pure, no
 * I/O.
 *
 * - A file already on this submission is kept.
 * - A file on another submission is left where it is. Copying a submission
 *   copies its file references, and the copy must not take the files.
 * - A submission package is rejected.
 * - A pending upload is linked when its uploader is the submitter: createdBy
 *   is the submitter's usernameIdp (see PUBLIC_UPLOADER for anonymous and
 *   form API key submitters). Any other pending upload is rejected; the app
 *   only sends the submitter's own pending uploads, since their ids exist only
 *   in the uploader's page until a save attaches them.
 *
 * @param {object} args
 * @param {object} args.file the file_storage row.
 * @param {string} args.submissionId the submission being saved.
 * @param {object} args.user the current user; the public user when not signed in.
 * @returns {string} one of FILE_LINK.
 */
const decideFileLink = ({ file, submissionId, user }) => {
  if (file.formSubmissionId) {
    return file.formSubmissionId === submissionId ? FILE_LINK.KEEP : FILE_LINK.LEAVE;
  }

  if (isPackageFile(file)) {
    return FILE_LINK.REJECT;
  }

  return file.createdBy === submitterOf(user) ? FILE_LINK.LINK : FILE_LINK.REJECT;
};

/**
 * @function planFileLinks
 * Applies decideFileLink to the files a submission save names. A rejected
 * file is logged with why, so a 400 can be traced.
 *
 * @param {object} args
 * @param {object[]} args.files the file_storage rows the submission data names.
 * @param {string} args.submissionId the submission being saved.
 * @param {object} args.user the current user.
 * @returns {{ link: object[], left: number }} the files to link, and how many
 *   are left on another submission.
 * @throws Problem 400 if any file is rejected, so the save changes nothing.
 */
const planFileLinks = ({ files, submissionId, user }) => {
  const link = [];
  let left = 0;
  for (const file of files) {
    const decision = decideFileLink({ file, submissionId, user });
    if (decision === FILE_LINK.REJECT) {
      log.warn('Submission names a file it cannot attach', {
        submissionId,
        fileId: file.id,
        reason: isPackageFile(file) ? 'package' : 'uploader',
        createdBy: file.createdBy,
        submitter: submitterOf(user),
      });
      throw new Problem(400, { detail: FILE_LINK_REJECTED });
    }
    if (decision === FILE_LINK.LINK) link.push(file);
    if (decision === FILE_LINK.LEAVE) left += 1;
  }
  return { link, left };
};

module.exports = {
  FILE_LINK,
  FILE_LINK_REJECTED,
  decideFileLink,
  normalizeFileIds,
  planFileLinks,
};
