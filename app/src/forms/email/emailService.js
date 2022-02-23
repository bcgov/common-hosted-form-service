const fs = require('fs');
const path = require('path');

const chesService = require('../../components/chesService');
const log = require('../../components/log')(module.filename);
const { EmailProperties, EmailTypes } = require('../common/constants');
const formService = require('../form/service');

/** Helper function used to build the email template based on email type and contents */
const buildEmailTemplate = async (formId, formSubmissionId, emailType, referer, additionalProperties = 0) => {
  const form = await formService.readForm(formId);
  const submission = await formService.readSubmission(formSubmissionId);
  let configData = {};
  let contextToVal = [];
  let userTypePath = '';

  if (emailType === EmailTypes.SUBMISSION_ASSIGNED) {
    contextToVal = [additionalProperties.assignmentNotificationEmail];
    userTypePath = 'user/view';
    configData = {
      bodyTemplate: 'submission-assigned.html',
      title: `Invited to ${form.name} Draft`,
      subject: 'Invited to Submission Draft',
      messageLinkText: `You have been invited to a ${form.name} submission draft. You can review your submission draft details by visiting the following links:`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.STATUS_COMPLETED) {
    contextToVal = [additionalProperties.submissionUserEmail];
    userTypePath = 'user/view';
    configData = {
      bodyTemplate: 'submission-completed.html',
      title: `${form.name} Has Been Completed`,
      subject: 'Form Has Been Completed',
      messageLinkText: `Your submission from ${form.name} has been Completed.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.SUBMISSION_UNASSIGNED) {
    contextToVal = [additionalProperties.assignmentNotificationEmail];
    userTypePath = 'user/view';
    configData = {
      bodyTemplate: 'submission-unassigned.html',
      title: `Uninvited From ${form.name} Draft`,
      subject: 'Uninvited From Submission Draft',
      messageLinkText: `You have been uninvited from ${form.name} submission draft.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.STATUS_ASSIGNED) {
    contextToVal = [additionalProperties.assignmentNotificationEmail];
    userTypePath = 'form/view';
    configData = {
      bodyTemplate: 'send-status-assigned-email-body.html',
      title: `${form.name} Submission Assignment`,
      subject: 'Form Submission Assignment',
      messageLinkText: `You have been assigned to a ${form.name} submission. Please login to review it.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.STATUS_REVISING) {
    contextToVal = [additionalProperties.submissionUserEmail];
    userTypePath = 'user/view';
    configData = {
      bodyTemplate: 'send-status-revising-email-body.html',
      title: `${form.name} Submission Revision Requested`,
      subject: 'Form Submission Revision Request',
      messageLinkText: `You have been asked to revise a ${form.name} submission. Please login to review it.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.SUBMISSION_RECEIVED) {
    contextToVal = form.submissionReceivedEmails;
    userTypePath = 'form/view';
    configData = {
      body: additionalProperties.body,
      bodyTemplate: 'submission-confirmation.html',
      title: `${form.name} Submission`,
      subject: `${form.name} Submission`,
      messageLinkText: `There is a new ${form.name} submission. Please login to review it.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.SUBMISSION_CONFIRMATION) {
    contextToVal = [additionalProperties.body.to];
    userTypePath = 'form/success';
    const bodyTemplate = form.identityProviders.length > 0 && form.identityProviders[0].idp === 'public' ? 'submission-received-confirmation-public.html' : 'submission-received-confirmation-login.html';
    configData = {
      bodyTemplate: bodyTemplate,
      title: `${form.name} Accepted`,
      subject: `${form.name} Accepted`,
      priority: 'normal',
      messageLinkText: `Thank you for your ${form.name} submission. You can view your submission details by visiting the following links:`,
      form,
    };
  }

  return {
    configData,
    contexts: [{
      context: {
        allFormSubmissionUrl: `${service._appUrl(referer)}/user/submissions?f=${configData.form.id}`,
        confirmationNumber: submission.confirmationId,
        form: configData.form,
        messageLinkText: configData.messageLinkText,
        messageLinkUrl: `${service._appUrl(referer)}/${userTypePath}?s=${submission.id}`,
        revisionNotificationEmailContent: additionalProperties.revisionNotificationEmailContent,
        title: configData.title
      },
      to: contextToVal
    }]
  };
};

const service = {
  /**
   * @function _appUrl
   * Attempts to parse out the base application url
   * @param {string} referer
   * @returns base url for the application
   */
  _appUrl: (referer) => {
    try {
      const url = new URL(referer);
      const p = url.pathname.split('/')[1];
      const u = url.href.substring(0, url.href.indexOf(`/${p}`));
      return `${u}/${p}`;
    } catch (err) {
      log.error(err.message, {
        function: '_appUrl',
        referer: referer
      });
      throw err;
    }
  },

  /**
   * @function _mergeEmailTemplate
   * Merges the template and body HTML files to allow dynamic content in the emails
   * @param {*} bodyTemplate
   * @returns joined template files
   */
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

  /**
   * @function _sendEmailTemplate
   * Sends email using chesService.merge
   * @param {string} configData
   * @param {string} contexts
   * @returns The result of the email merge operation
   */
  _sendEmailTemplate: (configData, contexts) => {
    try {
      const mergedHtml = service._mergeEmailTemplate(configData.bodyTemplate);
      const data = {
        body: mergedHtml,
        bodyType: 'html',
        contexts: contexts,
        from: EmailProperties.FROM_EMAIL,
        subject: configData.subject,
        title: configData.title,
        priority: configData.priority,
        messageLinkText: configData.messageLinkText,
      };
      return chesService.merge(data);
    } catch (err) {
      log.error(err.message, { function: '_sendEmailTemplate' });
      throw err;
    }
  },

  /**
   * @function submissionAssigned
   * Assigning user to Submission Draft
   * @param {string} formId
   * @param {string} currentStatus
   * @param {string} assignmentNotificationEmail
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  submissionAssigned: async (formId, currentStatus, assignmentNotificationEmail, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.formSubmissionId, EmailTypes.SUBMISSION_ASSIGNED, referer, { assignmentNotificationEmail });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.SUBMISSION_ASSIGNED,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function submissionUnassigned
   * Unassigning user from Submission Draft
   * @param {string} formId
   * @param {string} currentStatus
   * @param {string} assignmentNotificationEmail
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  submissionUnassigned: async (formId, currentStatus, assignmentNotificationEmail, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.formSubmissionId, EmailTypes.SUBMISSION_UNASSIGNED, referer, { assignmentNotificationEmail });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.SUBMISSION_UNASSIGNED,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function statusAssigned
   * Setting Assigned status to user on Submission
   * @param {string} formId
   * @param {string} currentStatus
   * @param {string} assignmentNotificationEmail
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  statusAssigned: async (formId, currentStatus, assignmentNotificationEmail, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.submissionId, EmailTypes.STATUS_ASSIGNED, referer, { assignmentNotificationEmail });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.STATUS_ASSIGNED,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function statusCompleted
   * Setting Completed status to user on Submission
   * @param {string} formId
   * @param {string} currentStatus
   * @param {string} submissionUserEmail The email address to send to
   * @param {string} referer
   * @returns {object} The result of the email merged from operation
   */
  statusCompleted: async (formId, currentStatus, submissionUserEmail, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.submissionId, EmailTypes.STATUS_COMPLETED, referer, { submissionUserEmail });
      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.STATUS_COMPLETED,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function statusRevising
   * Revising status to submission form owner
   * @param {string} formId The form id
   * @param {string} currentStatus The current status
   * @param {string} submissionUserEmail The email address to send to
   * @param {string} revisionNotificationEmailContent The optional content to send as a comment
   * @param {string} referer The currently logged in user
   * @returns The result of the email merge operation
   */
  statusRevising: async (formId, currentStatus, submissionUserEmail, revisionNotificationEmailContent, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.submissionId, EmailTypes.STATUS_REVISING, referer, { submissionUserEmail, revisionNotificationEmailContent });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, e, {
        function: EmailTypes.STATUS_REVISING,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function submissionReceived
   * Completing submission of a form
   * @param {string} formId
   * @param {string} submissionId
   * @param {string} body
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  submissionReceived: async (formId, submissionId, body, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, submissionId, EmailTypes.SUBMISSION_RECEIVED, referer, { body });
      if (contexts[0].to.length) {
        return service._sendEmailTemplate(configData, contexts);
      } else {
        return {};
      }
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.SUBMISSION_RECEIVED,
        formId: formId,
        submissionId: submissionId,
        body: body,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function submissionConfirmation
   * Manual email confirmation after form has been submitted
   * @param {string} formId
   * @param {string} submissionId
   * @param {string} body
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  submissionConfirmation: async (formId, submissionId, body, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, submissionId, EmailTypes.SUBMISSION_CONFIRMATION, referer, { body: body });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.SUBMISSION_CONFIRMATION,
        formId: formId,
        submissionId: submissionId,
        body: body,
        referer: referer
      });
      throw e;
    }
  },
};

module.exports = service;
