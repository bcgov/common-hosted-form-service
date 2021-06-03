const chesService = require('../../components/chesService');
const fs = require('fs');
const log = require('npmlog');
const path = require('path');
const constants = require('../common/constants');

const formService = require('../form/service');

const service = {

  _appUrl: (referer) => {
    try {
      const url = new URL(referer);
      const p = url.pathname.split('/')[1];
      const u = url.href.substring(0, url.href.indexOf(`/${p}`));
      return `${u}/${p}`;
    } catch (err) {
      log.error('_appUrl', `URL = ${JSON.stringify(referer)}. Error: ${err.message}.`);
      log.error(err);
      throw err;
    }
  },

  _sendStatusAssigned: async (assignmentNotificationEmail, submission, referer) => {
    try {
      // these may get persisted at some point...
      // along with a template path, mess
      const config = {
        template: 'triggered-notification-email-template.html',
        from: constants.EmailProperties.FROM_EMAIL,
        subject: 'Form Submission Assignment',
        title: 'Form Submission Assignment',
        priority: 'normal',
        messageLinkText: 'You have been assigned to review this submission.',
        messageLinkUrl: `${service._appUrl(referer)}/form/view?s=`
      };

      const assetsPath = path.join(__dirname, 'assets');
      const emailBody = fs.readFileSync(`${assetsPath}/${config.template}`, 'utf8');

      const contexts = [
        {
          context: {
            confirmationNumber: submission.confirmationId,
            title: config.title,
            messageLinkText: config.messageLinkText,
            messageLinkUrl: `${config.messageLinkUrl}${submission.id}`
          },
          to: [assignmentNotificationEmail]
        }
      ];

      const data = {
        body: emailBody,
        bodyType: 'html',
        contexts: contexts,
        ...config
      };
      return await chesService.merge(data);
    } catch (err) {
      log.error('_sendStatusAssigned', `Error: ${err.message}.`);
      log.error(err);
      throw err;
    }
  },

  _sendSubmissionConfirmation: async (form, submission, body, referer) => {
    // body = { to }
    if (form.showSubmissionConfirmation) {
      try {
        // these may get persisted at some point...
        // along with a template path, mess
        const messageLinks = [
          {
            text: 'Your Submission has been recieved',
            url: `${service._appUrl(referer)}/form/success?s=${submission.id}`
          },
          {
            text: 'List all your previous submissions to this form',
            url: `${service._appUrl(referer)}/user/submissions?f=${form.id}`
          }
        ];
        const config = {
          template: 'triggered-notification-email-template.html',
          from: constants.EmailProperties.FROM_EMAIL,
          subject: `${form.name} Submission`,
          title: `${form.name} Submission`,
          priority: 'normal',
          // TODO: after email body refactoring both links will be inserted into email
          messageLinkText: messageLinks[0].text,
          messageLinkUrl: messageLinks[0].url
        };

        const assetsPath = path.join(__dirname, 'assets');
        const emailBody = fs.readFileSync(`${assetsPath}/${config.template}`, 'utf8');

        const contexts = [
          {
            context: {
              confirmationNumber: submission.confirmationId,
              title: config.title,
              messageLinkText: config.messageLinkText,
              messageLinkUrl: config.messageLinkUrl
            },
            to: [body.to]
          }
        ];

        const data = {
          body: emailBody,
          bodyType: 'html',
          contexts: contexts,
          ...config
        };
        return await chesService.merge(data);
      } catch (err) {
        log.error('sendSubmissionConfirmation', `Error: ${err.message}.`);
        log.error(err);
        throw err;
      }
    }
  },

  _sendSubmissionReceived: async (form, submission, referer) => {
    if (form.submissionReceivedEmails && form.submissionReceivedEmails.length) {
      try {
        // these may get persisted at some point...
        // along with a template path, mess
        const config = {
          template: 'triggered-notification-email-template.html',
          from: constants.EmailProperties.FROM_EMAIL,
          subject: `${form.name} Accepted`,
          title: `${form.name} Accepted`,
          priority: 'normal',
          messageLinkText: `Please login to view the details of this ${form.name} submission`,
          messageLinkUrl: `${service._appUrl(referer)}/form/submissions?f=`
        };

        const assetsPath = path.join(__dirname, 'assets');
        const emailBody = fs.readFileSync(`${assetsPath}/${config.template}`, 'utf8');

        const contexts = [
          {
            context: {
              bottomText: `You are receiving this because this email address has been designated as a notification email address for successful submissions of the ${form.name} form`,
              confirmationNumber: submission.confirmationId,
              title: config.title,
              messageLinkText: config.messageLinkText,
              messageLinkUrl: `${config.messageLinkUrl}${form.id}`
            },
            to: form.submissionReceivedEmails
          }
        ];

        const data = {
          body: emailBody,
          bodyType: 'html',
          contexts: contexts,
          ...config
        };
        return await chesService.merge(data);
      } catch (err) {
        log.error('sendSubmissionReceived', `Error: ${err.message}.`);
        log.error(err);
        throw err;
      }
    }
  },

  statusAssigned: async (currentStatus, assignmentNotificationEmail, referer) => {
    try {
      const submission = await formService.readSubmission(currentStatus.submissionId);
      return service._sendStatusAssigned(assignmentNotificationEmail, submission, referer);
    } catch (e) {
      log.error('statusAssigned', `status: ${currentStatus}, referer: ${referer}`);
      log.error('statusAssigned', e.message);
      log.error(e);
      throw e;
    }
  },

  submissionConfirmation: async (formId, submissionId, body, referer) => {
    try {
      const form = await formService.readForm(formId);
      const submission = await formService.readSubmission(submissionId);
      return service._sendSubmissionConfirmation(form, submission, body, referer);
    } catch (e) {
      log.error('submissionConfirmation', `formId: ${formId}, submissionId: ${submissionId}, body: ${JSON.stringify(body)}, referer: ${referer}`);
      log.error('submissionConfirmation', e.message);
      log.error(e);
      throw e;
    }
  },

  submissionReceived: async (formId, submissionId, referer) => {
    try {
      const form = await formService.readForm(formId);
      const submission = await formService.readSubmission(submissionId);
      return service._sendSubmissionReceived(form, submission, referer);
    } catch (e) {
      log.error('submissionReceived', `formId: ${formId}, submissionId: ${submissionId}, referer: ${referer}`);
      log.error('submissionReceived', e.message);
      log.error(e);
      throw e;
    }
  }

};

module.exports = service;
