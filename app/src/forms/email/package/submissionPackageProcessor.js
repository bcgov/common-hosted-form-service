const { getBaseUrl } = require('../../common/utils');

const featureService = require('../../feature/service');
const formService = require('../../form/service');
const submissionService = require('../../submission/service');
const emailService = require('../emailService');
const packageService = require('./packageService');
const submissionPackageBuilder = require('./submissionPackageBuilder');

const service = {
  process: async ({ jobId, formId, submissionId }) => {
    await packageService.appendLog(jobId, `Reading form ${formId} and submission ${submissionId}.`);

    const form = await formService.readForm(formId);
    const submission = await submissionService.read(submissionId);

    const submitToEmail = await featureService.resolve('submitToEmail', { formId });

    if (!form.enableSubmissionPackageEmail || !submitToEmail.active) {
      await packageService.appendLog(jobId, 'Skipped: submitToEmail disabled or form setting off.');
      return;
    }

    if (!form.submissionPackageEmails?.length) {
      await packageService.appendLog(jobId, 'Skipped: no submission package email recipients configured.');
      return;
    }

    await packageService.appendLog(jobId, 'Building and writing submission package.');

    const packageResult = await submissionPackageBuilder.writeSubmissionPackage({
      form,
      submission,
    });

    await packageService.appendLog(jobId, `Package written: ${packageResult.filename}.`);

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
          confirmationNumber: submission.confirmationId,
          form,
          messageLinkText: configData.messageLinkText,
          messageLinkUrl: `${baseUrl}/form/view?s=${submission.id}`,
          submissionPackageUrl: `${baseUrl}/api/v1/files/${packageResult.fileRecord.id}`,
          title: configData.title,
        },
        to: form.submissionPackageEmails,
      },
    ];

    try {
      const result = emailService._sendEmailTemplate(configData, contexts);
      await packageService.appendLog(jobId, 'Submission package email sent.');
      return result;
    } catch (e) {
      await packageService.appendLog(jobId, `Submission package email error.${e.message}`);
      throw e;
    }
  },
};

module.exports = service;
