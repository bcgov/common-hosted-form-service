const Problem = require('api-problem');

const fileService = require('../../../forms/file/service');

/**
 * Anonymous file routes only: the file must have been uploaded for the form in the
 * path and not yet be part of a submission. Any other file, or none, is not found.
 * Runs after runtime-auth, which has loaded the form from the path.
 */
module.exports = async function requireUnsubmittedFormFile(req, _res, next) {
  try {
    const [file] = await fileService.findByIds([req.params.fileId]);
    if (!file || file.formId !== req.securityContext.resource.form.id || file.formSubmissionId) {
      return next(new Problem(404, { detail: 'File not found.' }));
    }
    req.currentFileRecord = file;
    return next();
  } catch (error) {
    return next(error);
  }
};
