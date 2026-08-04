const { getBaseUrl } = require('../../../common/utils');
const packageBuilder = require('../packageBuilder');

// Delivery strategy: send the rendered report + submission files as inline email
// attachments (no zip, no stored file, no download link). Chosen only when the
// sizes/count are within the configured limits (see delivery.decide).
const service = {
  name: 'attachment',

  /**
   * Assemble the email payload with the report + files as CHES attachments.
   * Returns the same shape as every strategy: { configData, contexts, summary }.
   * `report` is the already-rendered report (rendering is shared, in the processor).
   */
  prepare: async ({ form, submission, report, files, recipients }) => {
    const attachments = [
      packageBuilder.toChesAttachment({ filename: report.filename, buffer: report.buffer }),
      ...files.map((file) => packageBuilder.toChesAttachment({ filename: file.filename, buffer: file.buffer, contentType: file.mimeType })),
    ];

    const baseUrl = getBaseUrl();
    const configData = {
      bodyTemplate: 'submission-attachments.html',
      title: `${form.name} Submission`,
      subject: `${form.name} Submission`,
      messageLinkText: `There is a new ${form.name} submission. The formatted submission and its attachments are attached to this email.`,
      priority: 'normal',
      form,
      attachments,
    };
    const contexts = [
      {
        context: {
          allFormSubmissionUrl: `${baseUrl}/user/submissions?f=${form.id}`,
          confirmationNumber: submission.submission.confirmationId,
          form,
          messageLinkText: configData.messageLinkText,
          messageLinkUrl: `${baseUrl}/form/view?s=${submission.submission.id}`,
          title: configData.title,
        },
        to: recipients,
      },
    ];

    const totalBytes = report.buffer.length + files.reduce((sum, file) => sum + file.buffer.length, 0);
    const summary = `Email attachments: report + ${files.length} file(s), ${totalBytes} bytes (before base64 encoding).`;

    return { configData, contexts, summary };
  },
};

module.exports = service;
