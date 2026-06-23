const cdogsService = require('../../../components/cdogsService');

const documentTemplateService = require('../../../forms/form/documentTemplate/service');

const submissionService = require('../../../forms/submission/service');
const cdogsV3Service = cdogsService.v3;

const chefsTemplate = (submission) => {
  /*
    A helper method to build the data object for CDOGS export
   */
  return {
    ...submission.submission.submission.data,
    chefs: {
      formVersion: submission.version.version,
      submissionId: submission.submission.id,
      confirmationId: submission.submission.confirmationId,
      createdBy: submission.submission.createdBy,
      createdAt: submission.submission.createdAt,
      updatedBy: submission.submission.updatedBy,
      updatedAt: submission.submission.updatedAt,
      isDraft: submission.submission.draft,
      isDeleted: submission.submission.deleted,
    },
  };
};

module.exports = {
  /**
   * Takes a document template ID and a form submission ID and renders the
   * template into a document.
   *
   * @param {Object} req the Express object representing the HTTP request.
   * @param {Object} res the Express object representing the HTTP response.
   * @param {Object} next the Express chaining function.
   */
  templateRender: async (req, res, next) => {
    try {
      const submission = await submissionService.read(req.params.formSubmissionId);
      const template = await documentTemplateService.documentTemplateRead(req.params.documentTemplateId);
      const fileName = template.filename.substring(0, template.filename.lastIndexOf('.'));
      const fileExtension = template.filename.substring(template.filename.lastIndexOf('.') + 1);
      const convertTo = req.query.convertTo || 'pdf';
      const templateBody = {
        ...req.body,
        data: chefsTemplate(submission),
        options: {
          convertTo: convertTo,
          overwrite: true,
          reportName: fileName,
        },
        template: {
          content: template.template.toString(),
          encodingType: 'base64',
          fileType: fileExtension,
        },
      };

      const { data, headers, status } = await cdogsV3Service.templateUploadAndRender(templateBody);

      res
        .status(status)
        .set({
          'Content-Disposition': 'attachment',
          'Content-Type': headers['content-type'],
        })
        .send(data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Takes a document template file and a form submission ID and renders the
   * template into a document.
   *
   * @param {Object} req the Express object representing the HTTP request.
   * @param {Object} res the Express object representing the HTTP response.
   * @param {Object} next the Express chaining function.
   */
  templateUploadAndRender: async (req, res, next) => {
    try {
      const submission = await submissionService.read(req.params.formSubmissionId);
      const templateBody = {
        ...req.body,
        data: chefsTemplate(submission),
      };

      const { data, headers, status } = await cdogsV3Service.templateUploadAndRender(templateBody);
      res
        .status(status)
        .set({
          'Content-Disposition': 'attachment',
          'Content-Type': headers['content-type'],
        })
        .send(data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Takes a document template file and a form submission object and renders the
   * template into a document.
   *
   * @param {Object} req the Express object representing the HTTP request.
   * @param {Object} res the Express object representing the HTTP response.
   * @param {Object} next the Express chaining function.
   */
  draftTemplateUploadAndRender: async (req, res, next) => {
    try {
      const templateBody = { ...req.body.template, data: req.body.submission.data };
      const { data, headers, status } = await cdogsV3Service.templateUploadAndRender(templateBody);

      res
        .status(status)
        .set({
          'Content-Disposition': 'attachment',
          'Content-Type': headers['content-type'],
        })
        .send(data);
    } catch (error) {
      next(error);
    }
  },
};
