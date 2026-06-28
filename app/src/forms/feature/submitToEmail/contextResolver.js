const featureService = require('../service');
const formService = require('../../form/service');
const submissionService = require('../../submission/service');
const documentTemplateService = require('../../form/documentTemplate/service');

// Objection throwIfNotFound() throws a NotFoundError. Treat that as "absent"
// (a permanent condition the caller decides on); let any other error (e.g. a
// transient DB failure) propagate so the job is retried.
const orNullIfNotFound = async (promise) => {
  try {
    return await promise;
  } catch (error) {
    if (error && error.name === 'NotFoundError') return null;
    throw error;
  }
};

const service = {
  /**
   * Gather everything a package job needs in one pass. Returns nulls for entities
   * that don't exist (a permanent condition the processor decides on); transient
   * errors propagate so the job is retried. No logging, no policy decisions.
   *
   * @returns {Promise<{submission, form, version, settings, allowed, template}>}
   *   submission — composite { submission, version, form } | null
   *   form       — form (with submissionPackageSettings) | null
   *   version    — form version number for this submission | null
   *   settings   — form.submissionPackageSettings | null
   *   allowed    — submitToEmail active for this form (allowlist) : boolean
   *   template   — document template record | null (null if configured but gone)
   */
  resolve: async ({ formId, submissionId }) => {
    const [submission, form, submitToEmail] = await Promise.all([
      orNullIfNotFound(submissionService.read(submissionId)),
      orNullIfNotFound(formService.readForm(formId)),
      featureService.resolve('submitToEmail', { formId }),
    ]);

    const settings = form ? form.submissionPackageSettings : null;
    const version = submission ? submission.version.version : null;
    const template = settings && settings.templateId ? await orNullIfNotFound(documentTemplateService.documentTemplateRead(settings.templateId)) : null;

    return { submission, form, version, settings, allowed: submitToEmail.active, template };
  },
};

module.exports = service;
