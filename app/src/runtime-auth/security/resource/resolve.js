/**
 * Registry-based resource resolver with default kinds:
 *  - fileFromSubmission: verifies file ↔ submission ↔ form chain
 *  - submissionFromForm: verifies submission ↔ form
 *  - formOnly: verifies form
 *  - none: no resource
 */

const ERRORS = require('../errorMessages');
const securityLog = require('../logger');

// Helpers: Validation functions
function validateFileSubmission(fileSubmissionId, urlSubmissionId) {
  return !urlSubmissionId || !fileSubmissionId || String(fileSubmissionId) === String(urlSubmissionId);
}

function validateSubmissionForm(submissionFormId, urlFormId) {
  return !urlFormId || String(submissionFormId) === String(urlFormId);
}

function validateFileForm(fileFormId, urlFormId) {
  return !urlFormId || String(fileFormId) === String(urlFormId);
}

// Helper: Validate service exists and has required method
function requireServiceMethod(service, name, method) {
  if (!service) {
    throw new Error(ERRORS.SERVICE_MISSING(name));
  }
  if (typeof service[method] !== 'function') {
    throw new TypeError(ERRORS.SERVICE_METHOD_INVALID(name, method));
  }
  return service;
}

module.exports = function makeResourceResolver({ deps }) {
  const { formService, submissionService, fileService } = deps.services || {};
  const resolverLogger = securityLog.resourceResolver;

  // Helper: Load file with submission context
  async function loadFileWithSubmission(fileSubmissionId, file, formId) {
    requireServiceMethod(submissionService, 'submissionService', 'read');

    try {
      const submissionData = await submissionService.read(fileSubmissionId);
      if (!submissionData?.form) return null;
      if (!validateSubmissionForm(submissionData.form.id, formId)) return null;
      return { form: submissionData.form, submission: submissionData.submission, file };
    } catch (error) {
      resolverLogger.debug({ event: 'resource_not_found', error: error.message });
      return null;
    }
  }

  // Helper: Load file with form context (draft file)
  async function loadFileWithForm(fileFormId, file, formId) {
    if (!validateFileForm(fileFormId, formId)) return null;

    requireServiceMethod(formService, 'formService', 'readForm');

    try {
      const form = await formService.readForm(fileFormId);
      if (!form) return null;
      return { form, submission: null, file };
    } catch (error) {
      resolverLogger.debug({ event: 'resource_not_found', error: error.message });
      return null;
    }
  }

  const loaders = {
    async file(_req, spec) {
      const { fileId } = spec.params || {};
      if (!fileId) return null;

      requireServiceMethod(fileService, 'fileService', 'read');

      let file;
      try {
        file = await fileService.read(fileId);
      } catch (error) {
        resolverLogger.debug({ event: 'resource_not_found', error: error.message });
        return null;
      }

      if (!file) return null;

      // Smart file resolver: automatically detect file state and load appropriate context

      // If file has formSubmissionId, it's a submitted file - load submission context
      if (file.formSubmissionId) {
        requireServiceMethod(submissionService, 'submissionService', 'read');
        try {
          const submissionData = await submissionService.read(file.formSubmissionId);
          if (!submissionData?.form) return null;

          requireServiceMethod(formService, 'formService', 'readForm');
          const form = await formService.readForm(submissionData.form.id);
          if (!form) return null;

          return { form, submission: submissionData.submission, file };
        } catch (error) {
          resolverLogger.debug({ event: 'resource_not_found', error: error.message });
          return null;
        }
      }

      // If file has no formSubmissionId, it's a draft file
      // For draft files, we can't determine the form from the file record alone
      // The form relationship is established during upload via query parameters
      // Draft files are handled by uploader permissions, not form permissions
      return { form: null, submission: null, file };
    },

    async fileFromSubmission(_req, spec) {
      const { formId, submissionId, fileId } = spec.params || {};
      if (!fileId) return null;

      requireServiceMethod(fileService, 'fileService', 'read');

      let file;
      try {
        file = await fileService.read(fileId);
      } catch (error) {
        resolverLogger.debug({ event: 'resource_not_found', error: error.message });
        return null;
      }

      if (!file) return null;

      // For submitted files, validate submission link
      if (file.formSubmissionId && submissionId) {
        if (!validateFileSubmission(file.formSubmissionId, submissionId)) return null;
      }

      // Handle submitted files (with formSubmissionId)
      if (file.formSubmissionId) {
        return await loadFileWithSubmission(file.formSubmissionId, file, formId);
      }

      // Handle draft files (with formId only)
      if (file.formId) {
        return await loadFileWithForm(file.formId, file, formId);
      }

      return null;
    },

    async submissionFromForm(_req, spec) {
      const { formId, submissionId } = spec.params || {};

      if (!submissionId) return null;

      requireServiceMethod(submissionService, 'submissionService', 'read');

      try {
        const submissionData = await submissionService.read(submissionId);
        if (!submissionData || !submissionData.form) return null;

        // Verify formId matches if provided
        if (formId && String(submissionData.form.id) !== String(formId)) return null;

        return { form: submissionData.form, submission: submissionData.submission, file: null };
      } catch (error) {
        resolverLogger.debug({ event: 'resource_not_found', error: error.message });
        return null;
      }
    },

    async formOnly(_req, spec) {
      const { formId } = spec.params || {};
      if (!formId) return null;

      requireServiceMethod(formService, 'formService', 'readForm');

      try {
        const form = await formService.readForm(formId);
        if (!form) return null;

        return { form, submission: null, file: null };
      } catch (error) {
        resolverLogger.debug({ event: 'resource_not_found', error: error.message });
        return null;
      }
    },

    async none() {
      return {}; // no resource
    },
  };

  async function resolve(req, _deps, policy) {
    const spec = policy.resourceSpec || { kind: 'none' };
    const loader = loaders[spec.kind] || loaders.none;

    resolverLogger.debug({
      event: 'resource_resolution_start',
      resourceKind: spec.kind,
      params: spec.params,
      method: req.method,
      path: req.path,
    });

    const result = await loader(req, spec);
    if (!result) {
      resolverLogger.warn({
        event: 'resource_resolution_failed',
        resourceKind: spec.kind,
        params: spec.params,
        reason: 'No data returned from loader',
      });
      return null;
    }

    // Check if form is public (has 'public' identity provider)
    const publicForm = result.form?.identityProviders && result.form.identityProviders.some((idp) => idp.code === 'public');

    const resolvedResource = {
      form: result.form || null,
      submission: result.submission || null,
      file: result.file || null,
      publicForm: publicForm || false,
      activeForm: result.form?.active || false,
    };

    // Backward compatibility: Populate req.currentFileRecord for CHEFS file controllers
    if (resolvedResource.file) {
      req.currentFileRecord = resolvedResource.file;
    }

    resolverLogger.info({
      event: 'resource_resolution_complete',
      resourceKind: spec.kind,
      resourceId: resolvedResource.form?.id || resolvedResource.submission?.id || resolvedResource.file?.id || 'none',
      publicForm: publicForm || false,
      hasForm: !!resolvedResource.form,
      hasSubmission: !!resolvedResource.submission,
      hasFile: !!resolvedResource.file,
      fileState: resolvedResource.file?.formSubmissionId ? 'submitted' : 'draft',
    });

    return resolvedResource;
  }

  return { resolve };
};
