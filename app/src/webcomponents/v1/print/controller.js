const Problem = require('api-problem');
const path = require('node:path');

const cdogsService = require('../../../components/cdogsService');
const submissionService = require('../../../forms/submission/service');
const printConfigService = require('../../../forms/form/printConfig/service');
const documentTemplateService = require('../../../forms/form/documentTemplate/service');
const formService = require('../../../forms/form/service');
const { PrintConfigTypes } = require('../../../forms/common/constants');

const buildContentDisposition = (reportName = 'document', outputFileType = 'pdf') => `attachment; filename="${reportName || 'document'}.${outputFileType || 'pdf'}"`;

/**
 * Build the CDOGS template body from a template record and data payload.
 */
const buildTemplateBody = (template, reportName, outputFileType, data) => {
  const extension = path.extname(template.filename || '').replace('.', '') || 'docx';
  return {
    options: {
      reportName,
      convertTo: outputFileType || 'pdf',
      overwrite: true,
    },
    template: {
      content: template.template.toString(),
      encodingType: 'base64',
      fileType: extension,
    },
    data,
  };
};

/**
 * Enforce presence of a direct print configuration for the form.
 */
const getDirectPrintConfig = async (formId) => {
  const config = await printConfigService.readPrintConfig(formId);
  if (!config || config.code !== PrintConfigTypes.DIRECT) {
    throw new Problem(400, { detail: 'Direct print configuration is required for this form.' });
  }
  return config;
};

/**
 * Generate a report name based on printConfig and form name.
 */
const resolveReportName = (printConfig, formName) => {
  const customName = printConfig?.reportNameOption === 'custom' ? printConfig?.reportName : null;
  if (customName) return customName;
  return formName || '';
};

/**
 * Build the CDOGS data object from a submission record.
 */
const chefsTemplate = (submission) => {
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
   * Render a document for an existing submission using the form's direct print config.
   */
  printSubmission: async (req, res, next) => {
    try {
      const { formId, formSubmissionId } = req.params;
      const printConfig = await getDirectPrintConfig(formId);

      const submission = await submissionService.read(formSubmissionId);
      const template = await documentTemplateService.documentTemplateRead(printConfig.templateId);

      let reportName = resolveReportName(printConfig, submission.form?.name);
      if (!reportName) {
        const form = await formService.readPublishedForm(formId);
        reportName = resolveReportName(printConfig, form?.name);
      }
      const templateBody = buildTemplateBody(template, reportName, printConfig.outputFileType, chefsTemplate(submission));

      const { data, headers, status } = await cdogsService.templateUploadAndRender(templateBody);
      const contentDisposition = headers['content-disposition'] || buildContentDisposition(reportName, printConfig.outputFileType);

      res
        .status(status)
        .set({
          'Content-Disposition': contentDisposition || 'attachment',
          'Content-Type': headers['content-type'],
          'Access-Control-Expose-Headers': 'Content-Disposition, Content-Type',
        })
        .send(data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Render a document for a draft submission using the form's direct print config.
   * Expects submission data in req.body.submission.
   */
  printDraft: async (req, res, next) => {
    try {
      const { formId } = req.params;
      const printConfig = await getDirectPrintConfig(formId);
      const template = await documentTemplateService.documentTemplateRead(printConfig.templateId);

      // Fetch form name for report naming
      const form = await formService.readPublishedForm(formId);
      const submissionData = req.body?.submission?.data || req.body?.submission || {};
      const reportName = resolveReportName(printConfig, form?.name);

      const templateBody = buildTemplateBody(template, reportName, printConfig.outputFileType, submissionData);

      const { data, headers, status } = await cdogsService.templateUploadAndRender(templateBody);
      const contentDisposition = headers['content-disposition'] || buildContentDisposition(reportName, printConfig.outputFileType);

      res
        .status(status)
        .set({
          'Content-Disposition': contentDisposition || 'attachment',
          'Content-Type': headers['content-type'],
          'Access-Control-Expose-Headers': 'Content-Disposition, Content-Type',
        })
        .send(data);
    } catch (error) {
      next(error);
    }
  },
};
