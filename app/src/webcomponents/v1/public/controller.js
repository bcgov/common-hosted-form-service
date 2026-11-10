const Problem = require('api-problem');

const fileService = require('../../../forms/file/service');
const service = require('../../../forms/form/service');
const { formSchemaResponse, submitResponse } = require('../../common/responses');

module.exports = {
  /**
   * Form schema for an anonymous embed, same response as the keyed endpoint.
   * Query parameters are not passed through, so only the active published form is read.
   */
  readFormSchema: async (req, res, next) => {
    try {
      // runtime-auth has loaded the active published form from the path
      res.status(200).json(formSchemaResponse(req.securityContext.resource.form));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Anonymous submission from a Public form embedded on an allowed origin
   */
  createSubmission: async (req, res, next) => {
    try {
      const submissionData = req.body?.submission?.data;
      if (!submissionData || typeof submissionData !== 'object' || Array.isArray(submissionData)) {
        throw new Problem(400, { detail: `'submission.data' is required.` });
      }

      const version = req.securityContext.resource.form.versions?.[0];
      if (!version) {
        throw new Problem(400, { detail: 'No published version found for this form.' });
      }

      // Only the submission is taken from the request, and anonymous submissions are always final
      const { metadata } = req.body.submission;
      const data = { submission: metadata === undefined ? { data: submissionData } : { data: submissionData, metadata }, draft: false };

      // A file the submission references must be one uploaded here for this form and not yet submitted
      const submission = await service.createSubmission(version.id, data, req.currentUser, { ownUploadsOnly: true });
      res.status(201).json(submitResponse(submission));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Removes an anonymous upload for the form in the path that is not yet part of a submission
   */
  deleteFile: async (req, res, next) => {
    try {
      await fileService.deleteUnsubmittedUpload(req.params.fileId, req.securityContext.resource.form.id);
      res.sendStatus(202);
    } catch (error) {
      next(error);
    }
  },
};
