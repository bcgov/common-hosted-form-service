const fs = require('fs');
const path = require('path');

const chesService = require('../../components/chesService');
const log = require('../../components/log')(module.filename);
const { EmailProperties } = require('../common/constants');
const formService = require('../form/service');

// Helper function used to generate contexts for the ches.merge data argument
const generateContexts = (type, configData, submission, referer) => {
  let contextToVal = [];
  let userTypePath = '';
  if (type === 'sendStatusAssigned') {
    contextToVal = [configData.assignmentNotificationEmail];
    userTypePath = 'form/view?s=';
  } else if (type === 'sendSubmissionAssigned') {
    contextToVal = [configData.emailAddress];
    userTypePath = 'user/view?s=';
  } else if (type === 'sendSubmissionUnassigned') {
    contextToVal = [configData.emailAddress];
    userTypePath = 'user/view?s=';
  } else if (type === 'sendSubmissionConfirmation' && configData.form.showSubmissionConfirmation) {
    contextToVal = configData.form.submissionReceivedEmails;
    userTypePath = 'form/view?s=';
  } else if (type === 'sendSubmissionReceived' && configData.form.submissionReceivedEmails) {
    contextToVal = configData.form.submissionReceivedEmails;
    userTypePath = 'form/success?s=';
  }
  return [{
    context: {
      confirmationNumber: submission.confirmationId,
      title: configData.title,
      messageLinkText: configData.messageLinkText,
      messageLinkUrl: `${service._appUrl(referer)}/${userTypePath}${submission.id}`,
      allFormSubmissionUrl: `${service._appUrl(referer)}/form/submissions?f=${configData.form.id}`,
      form: configData.form,
    },
    to: contextToVal
  }];
};

const service = {
  _appUrl: (referer) => {
    try {
      const url = new URL(referer);
      const p = url.pathname.split('/')[1];
      const u = url.href.substring(0, url.href.indexOf(`/${p}`));
      return `${u}/${p}`;
    } catch (err) {
      log.error(`URL = ${JSON.stringify(referer)}. Error: ${err.message}.`, { function: '_appUrl' });
      log.error(err);
      throw err;
    }
  },

  // Function that merges the template and body HTML files to allow dynamic content in the emails.
  _mergeEmailTemplate: (bodyTemplate) => {
    const template = fs.readFileSync(
      `${path.join(
        __dirname,
        'assets'
      )}/triggered-notification-email-template.html`,
      'utf8'
    );
    const body = fs.readFileSync(
      `${path.join(__dirname, 'assets', 'bodies')}/${bodyTemplate}`,
      'utf8'
    );
    const bodyInsertIndex = template.search('<!-- BODY END -->');
    const result = [
      template.substring(0, bodyInsertIndex),
      body,
      template.substring(bodyInsertIndex, template.length),
    ].join('');

    return result;
  },

  // Sends email using chesService.merge
  _sendEmailTemplate: (type, configData, submission, referer) => {
    try {
      const mergedHtml = service._mergeEmailTemplate(configData.bodyTemplate);
      const data = {
        body: mergedHtml,
        bodyType: 'html',
        contexts: generateContexts(type, configData, submission, referer),
        from: EmailProperties.FROM_EMAIL,
        subject: configData.subject,
        title: configData.title,
        priority: configData.priority,
        messageLinkText: configData.messageLinkText,
      };
      return chesService.merge(data);
    } catch (err) {
      log.error(`Error: ${err.message}.`, { function: '_sendEmailTemplate' });
      throw err;
    }
  },

  // Assigning user to Submission Draft
  submissionAssigned: async (formId, currentStatus, emailAddress, referer) => {
    try {
      const form = await formService.readForm(formId);
      const submission = await formService.readSubmission(currentStatus.formSubmissionId);
      const configData = {
        bodyTemplate: 'submission-assigned.html',
        title: `Invited to ${form.name} Draft`,
        subject: 'Invited to Submission Draft',
        messageLinkText: `You have been invited to a ${form.name} submission draft. You can review your submission draft details by visiting the following links:`,
        priority: 'normal',
        emailAddress,
        form,
      };
      return service._sendEmailTemplate('sendSubmissionAssigned', configData, submission, referer);
    } catch (e) {
      log.error(`status: ${currentStatus}, referer: ${referer}`, { function: 'statusAssigned' });
      log.error(e.message, { function: 'submissionAssigned' });
      log.error(e);
      throw e;
    }
  },

  // Unassigning user to Submission Draft
  submissionUnassigned: async (formId, currentStatus, emailAddress, referer) => {
    try {
      const form = await formService.readForm(formId);
      const submission = await formService.readSubmission(currentStatus.formSubmissionId);
      const configData = {
        bodyTemplate: 'submission-unassigned.html',
        title: `Uninvited From ${form.name} Draft`,
        subject: 'Uninvited From Submission Draft',
        messageLinkText: `You have been uninvited from ${form.name} submission draft.`,
        priority: 'normal',
        emailAddress,
        form,
      };
      return service._sendEmailTemplate('sendSubmissionUnassigned', configData, submission, referer);
    } catch (e) {
      log.error(`status: ${currentStatus}, referer: ${referer}`, { function: 'statusAssigned' });
      log.error(e.message, { function: 'submissionUnassigned' });
      log.error(e);
      throw e;
    }
  },

  // Assigning status to user on Submission
  statusAssigned: async (formId, currentStatus, assignmentNotificationEmail, referer) => {
    try {
      const form = await formService.readForm(formId);
      const submission = await formService.readSubmission(currentStatus.submissionId);
      const configData = {
        bodyTemplate: 'send-status-assigned-email-body.html',
        title: `${form.name} Submission Assignment`,
        subject: 'Form Submission Assignment',
        messageLinkText: `You have been assigned to a ${form.name} submission. Please login to review it.`,
        priority: 'normal',
        assignmentNotificationEmail,
        form,
      };
      return service._sendEmailTemplate('sendStatusAssigned', configData, submission, referer);
    } catch (e) {
      log.error(`status: ${currentStatus}, referer: ${referer}`, { function: 'statusAssigned' });
      log.error(e.message, { function: 'statusAssigned' });
      log.error(e);
      throw e;
    }
  },

  // Submitting Form
  submissionReceived: async (formId, submissionId, body, referer) => {
    try {
      const form = await formService.readForm(formId);
      const submission = await formService.readSubmission(submissionId);
      const configData = {
        bodyTemplate: 'submission-confirmation.html',
        title: `${form.name} Submission`,
        subject: `${form.name} Submission`,
        messageLinkText: `There is a new ${form.name} submission. Please login to review it.`,
        priority: 'normal',
        body,
        form,
      };
      return service._sendEmailTemplate('sendSubmissionConfirmation', configData, submission, referer);
    } catch (e) {
      log.error(`formId: ${formId}, submissionId: ${submissionId}, body: ${JSON.stringify(body)}, referer: ${referer}`, { function: 'submissionConfirmation' });
      log.error(e.message, { function: 'submissionConfirmation' });
      log.error(e);
      throw e;
    }
  },

  // Sending confirmation of Form Submission
  submissionConfirmation: async (formId, submissionId, referer) => {
    try {
      const form = await formService.readForm(formId);
      const submission = await formService.readSubmission(submissionId);
      const configData = {
        bodyTemplate: 'submission-received-confirmation.html',
        title: `${form.name} Accepted`,
        subject: `${form.name} Accepted`,
        priority: 'normal',
        messageLinkText: `Thank you for your ${form.name} submission. You can view your submission details by visiting the following links:`,
        form,
      };
      return service._sendEmailTemplate('sendSubmissionReceived', configData, submission, referer);
    } catch (e) {
      log.error(`formId: ${formId}, submissionId: ${submissionId}, referer: ${referer}`, { function: 'submissionReceived' });
      log.error(e.message, { function: 'submissionReceived' });
      log.error(e);
      throw e;
    }
  },
};

module.exports = service;
