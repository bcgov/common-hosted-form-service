const { getBaseUrl } = require('../../../common/utils');
const packageBuilder = require('../packageBuilder');

// Delivery strategy: zip the rendered report + attachments, store the zip, and
// email a download link. No per-message size limit — this is the fallback when a
// submission is too large to deliver as inline attachments.
const service = {
  name: 'link',

  /**
   * Assemble the download-link email payload for an already-stored package file.
   * Used both after a fresh build and when re-sending a previously built package
   * on a retry (build-once / send-retry).
   */
  buildEmail: ({ form, submission, recipients, fileId }) => {
    const baseUrl = getBaseUrl();
    const configData = {
      bodyTemplate: 'submission-package.html',
      title: `${form.name} Submission`,
      subject: `${form.name} Submission`,
      messageLinkText: `There is a new ${form.name} submission. Please click below to download the attachments and formatted submission.`,
      priority: 'normal',
      form,
    };
    const contexts = [
      {
        context: {
          allFormSubmissionUrl: `${baseUrl}/user/submissions?f=${form.id}`,
          confirmationNumber: submission.submission.confirmationId,
          form,
          messageLinkText: configData.messageLinkText,
          messageLinkUrl: `${baseUrl}/form/view?s=${submission.submission.id}`,
          submissionPackageUrl: `${baseUrl}/api/v1/files/${fileId}`,
          title: configData.title,
        },
        to: recipients,
      },
    ];

    return { configData, contexts };
  },

  /**
   * Build the package (zip + store) and assemble the email payload. Returns the
   * common { configData, contexts, summary } plus `fileId` so the processor can
   * persist it on the job for build-once / send-retry. `report` is the
   * already-rendered report (rendering is shared and happens in the processor).
   */
  prepare: async ({ form, submission, report, files, recipients }) => {
    const zip = await packageBuilder.buildZip({ form, submission, report, files });
    const fileRecord = await packageBuilder.uploadPackage(zip);

    const { configData, contexts } = service.buildEmail({ form, submission, recipients, fileId: fileRecord.id });

    const summary = `Package built: ${zip.filename} (file ${fileRecord.id}) — ${zip.fileCount} attachment(s), ${zip.buffer.length} bytes.`;

    return { configData, contexts, summary, fileId: fileRecord.id };
  },
};

module.exports = service;
