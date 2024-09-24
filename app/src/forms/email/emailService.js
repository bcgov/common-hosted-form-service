const fs = require('fs');
const Handlebars = require('handlebars');
const path = require('path');

const { getBaseUrl } = require('../common/utils');
const chesService = require('../../components/chesService');
const log = require('../../components/log')(module.filename);
const { EmailProperties, EmailTypes } = require('../common/constants');
const formService = require('../form/service');
const moment = require('moment');

/**
 * Replace the {{ handlebar }} expressions in a string with the values from a
 * context object.
 * @param {string} format the string that is to have handlebars replaced
 * @param {object} context the values used to replace the handlebar items
 * @returns the format string with the handlebar items replaced
 */
const _replaceHandlebars = (format, context) => {
  const template = Handlebars.compile(format);

  return template(context);
};

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
    contextToVal = additionalProperties.submissionUserEmails; // already an array
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
    contextToVal = additionalProperties.submissionUserEmails; // already an array
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
    contextToVal = form.sendSubmissionReceivedEmail ? form.submissionReceivedEmails : [];
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
    const bodyTemplate =
      form.identityProviders.length > 0 && form.identityProviders[0].idp === 'public'
        ? 'submission-received-confirmation-public.html'
        : 'submission-received-confirmation-login.html';
    const emailTemplate = await formService.readEmailTemplate(form.id, emailType);

    // The data that is allowed to be used in the templates. This is currently
    // very restrictive due to PII concerns and keeping within the PIA allowable
    // uses of data.
    const handlebarsData = { form: { description: form.description, name: form.name } };

    configData = {
      bodyTemplate: bodyTemplate,
      title: _replaceHandlebars(emailTemplate.title, handlebarsData),
      subject: _replaceHandlebars(emailTemplate.subject, handlebarsData),
      priority: additionalProperties.body.priority,
      messageLinkText: _replaceHandlebars(emailTemplate.body, handlebarsData),
      form,
    };
  }

  const baseUrl = getBaseUrl();

  return {
    configData,
    contexts: [
      {
        context: {
          allFormSubmissionUrl: `${baseUrl}/user/submissions?f=${configData.form.id}`,
          confirmationNumber: submission.confirmationId,
          form: configData.form,
          messageLinkText: configData.messageLinkText,
          messageLinkUrl: `${baseUrl}/${userTypePath}?s=${submission.id}`,
          emailContent: additionalProperties.emailContent,
          title: configData.title,
        },
        to: contextToVal,
      },
    ],
  };
};

/** Helper function used to build the email template based on email type and contents for reminder */
const buildEmailTemplateFormForReminder = async (form, emailType, users, report, referer) => {
  let configData = {};
  const closeDate = report.dates.closeDate ? moment(report.dates.closeDate).format('MMM. D, YYYY') : undefined;
  const subject = 'CHEFS Submission Reminder';

  const formatEmailTextMessage = (name, closeDate) => {
    const messageValue = closeDate
      ? `This email is to inform you that the ${name} form is now open for submission and will stay open until ${closeDate}. Please complete your submission before the submission period is closed.`
      : `This email is to inform you that the ${name} form is now open for submission.`;
    return 'Hi,\n' + messageValue + '\nThank you';
  };
  const message = formatEmailTextMessage(form.name, closeDate);
  const contextToVal = users;
  if (emailType === EmailTypes.REMINDER_FORM_OPEN) {
    configData = {
      bodyTemplate: 'reminder-form-open.html',
      title: `Submission Start for ${form.name} `,
      subject: subject,
      messageLinkText: `${message}
      `,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.REMINDER_FORM_NOT_FILL) {
    configData = {
      bodyTemplate: 'reminder-form-not-fill.html',
      title: `Submission Reminder for ${form.name}`,
      subject: subject,
      messageLinkText: `${message}`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.REMINDER_FORM_WILL_CLOSE) {
    configData = {
      bodyTemplate: 'reminder-form-will-close.html',
      title: `Submission Closing for ${form.name}`,
      subject: subject,
      messageLinkText: `${message}`,
      priority: 'normal',
      form,
    };
  }

  return {
    configData,
    contexts: [
      {
        context: {
          allFormSubmissionUrl: '',
          form: configData.form,
          report: report,
          messageLinkText: configData.messageLinkText,
          messageLinkUrl: `${referer}/form/submit?f=${configData.form.id}`,
          title: configData.title,
        },
        to: contextToVal,
      },
    ],
  };
};

const service = {
  /**
   * @function _mergeEmailTemplate
   * Merges the template and body HTML files to allow dynamic content in the emails
   * @param {*} bodyTemplate
   * @returns joined template files
   */
  _mergeEmailTemplate: (bodyTemplate) => {
    const template = fs.readFileSync(`${path.join(__dirname, 'assets')}/triggered-notification-email-template.html`, 'utf8');
    const body = fs.readFileSync(`${path.join(__dirname, 'assets', 'bodies')}/${bodyTemplate}`, 'utf8');
    const bodyInsertIndex = template.search('<!-- BODY END -->');
    const result = [template.substring(0, bodyInsertIndex), body, template.substring(bodyInsertIndex, template.length)].join('');
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
        referer: referer,
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
        referer: referer,
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
   * @param {string} emailContent
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  statusAssigned: async (formId, currentStatus, assignmentNotificationEmail, emailContent, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.submissionId, EmailTypes.STATUS_ASSIGNED, referer, {
        assignmentNotificationEmail,
        emailContent,
      });
      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.STATUS_ASSIGNED,
        status: currentStatus,
        referer: referer,
      });
      throw e;
    }
  },

  /**
   * @function statusCompleted
   * Setting Completed status to user on Submission
   * @param {string} formId
   * @param {string} currentStatus
   * @param {string[]} submissionUserEmails The array of email addresses to send to
   * @param {string} emailContent
   * @param {string} referer
   * @returns {object} The result of the email merged from operation
   */
  statusCompleted: async (formId, currentStatus, submissionUserEmails, emailContent, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.submissionId, EmailTypes.STATUS_COMPLETED, referer, { submissionUserEmails, emailContent });
      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.STATUS_COMPLETED,
        status: currentStatus,
        referer: referer,
      });
      throw e;
    }
  },

  /**
   * @function statusRevising
   * Revising status to submission form owner
   * @param {string} formId The form id
   * @param {string} currentStatus The current status
   * @param {string[]} submissionUserEmails The array of email addresses to send to
   * @param {string} emailContent The optional content to send as a comment
   * @param {string} referer The currently logged in user
   * @returns The result of the email merge operation
   */
  statusRevising: async (formId, currentStatus, submissionUserEmails, emailContent, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.submissionId, EmailTypes.STATUS_REVISING, referer, { submissionUserEmails, emailContent });
      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, e, {
        function: EmailTypes.STATUS_REVISING,
        status: currentStatus,
        referer: referer,
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
        referer: referer,
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
        referer: referer,
      });
      throw e;
    }
  },

  /**
   * @function formOpen
   * Manual email confirmation after form has been submitted
   * @param {object} information about the submitter and the form
   * @returns The result of the email merge operation
   */
  initReminder: async (obj) => {
    try {
      const { configData, contexts } = await buildEmailTemplateFormForReminder(obj.form, obj.state, obj.users, obj.report, obj.referer);
      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: obj.state,
        formId: obj.form.id,
      });
      throw e;
    }
  },

  /**
   * @function submissionExportLink
   * Email with the link to the Form submissions export file
   * @param {string} formId
   * @param {object} body
   * @param {string} fileId
   * @returns The result of the email merge operation
   */
  submissionExportLink: async (formId, body, fileId) => {
    try {
      const form = await formService.readForm(formId);
      const contextToVal = [body.to];
      const userTypePath = 'file/download';
      const bodyTemplate = 'file-download-ready.html';
      const configData = {
        bodyTemplate: bodyTemplate,
        title: 'CHEFS Data Export',
        subject: `CHEFS: ${form.name} submissions export`,
        priority: 'normal',
        messageLinkText: `Your data export for ${form.name} is ready`,
        form,
      };
      const contexts = [
        {
          context: {
            form: configData.form,
            messageLinkText: configData.messageLinkText,
            messageLinkUrl: getBaseUrl() + `/${userTypePath}?id=${fileId}`,
            title: configData.title,
          },
          to: contextToVal,
        },
      ];

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.SUBMISSION_EXPORT,
        formId: formId,
        body: body,
      });
      throw e;
    }
  },
};

module.exports = service;
