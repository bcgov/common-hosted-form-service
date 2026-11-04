const Problem = require('api-problem');

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

      // Files cannot be uploaded anonymously, so a submission cannot claim any
      if (service._findFileIds(version.schema, data).length) {
        throw new Problem(400, { detail: 'Anonymous submissions cannot include files.' });
      }

      const submission = await service.createSubmission(version.id, data, req.currentUser);
      res.status(201).json(submitResponse(submission));
    } catch (error) {
      next(error);
    }
  },
};
