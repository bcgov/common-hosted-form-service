const cdogsService = require('../../components/cdogsService');

const { Statuses } = require('../common/constants');
const emailService = require('../email/emailService');
const formService = require('../form/service');

const service = require('./service');

module.exports = {
  read: async (req, res, next) => {
    try {
      const response = await service.read(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const response = await service.update(req.params.formSubmissionId, req.body, req.currentUser, req.headers.referer);
      if (!response) {
        // Return Bad request if we're trying to save draft on already submitted record
        res.status(400).json({ detail: 'Incorrect Submission status.' });
      } else {
        res.status(200).json(response);
      }
    } catch (error) {
      next(error);
    }
  },
  delete: async (req, res, next) => {
    try {
      const response = await service.delete(req.params.formSubmissionId, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  deleteMultipleSubmissions: async (req, res, next) => {
    try {
      let submissionIds = req.body && req.body.submissionIds ? req.body.submissionIds : [];
      const response = await service.deleteMultipleSubmissions(submissionIds, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  restoreMultipleSubmissions: async (req, res, next) => {
    try {
      let submissionIds = req.body && req.body.submissionIds ? req.body.submissionIds : [];
      const response = await service.restoreMultipleSubmissions(submissionIds, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  restore: async (req, res, next) => {
    try {
      const response = await service.restore(req.params.formSubmissionId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readOptions: async (req, res, next) => {
    try {
      const response = await service.readOptions(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getNotes: async (req, res, next) => {
    try {
      const response = await service.getNotes(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  addNote: async (req, res, next) => {
    try {
      const response = await service.addNote(req.params.formSubmissionId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getStatus: async (req, res, next) => {
    try {
      const response = await service.getStatus(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  addStatus: async (req, res, next) => {
    try {
      const tasks = [service.changeStatusState(req.params.formSubmissionId, req.body, req.currentUser), service.read(req.params.formSubmissionId)];
      const [response, submission] = await Promise.all(tasks);
      // send an email (async in the background)
      if (req.body.code === Statuses.ASSIGNED && req.body.assignmentNotificationEmail) {
        emailService
          .statusAssigned(submission.form.id, response[0], req.body.assignmentNotificationEmail, req.body.revisionNotificationEmailContent, req.headers.referer)
          .catch(() => {});
      } else if (req.body.code === Statuses.COMPLETED && req.body.submissionUserEmails) {
        emailService
          .statusCompleted(submission.form.id, response[0], req.body.submissionUserEmails, req.body.revisionNotificationEmailContent, req.headers.referer)
          .catch(() => {});
      } else if (req.body.code === Statuses.REVISING && req.body.submissionUserEmails) {
        emailService.statusRevising(submission.form.id, response[0], req.body.submissionUserEmails, req.body.revisionNotificationEmailContent, req.headers.referer).catch(() => {});
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  email: async (req, res, next) => {
    try {
      const submission = await service.read(req.params.formSubmissionId);
      const response = await emailService.submissionConfirmation(submission.form.id, req.params.formSubmissionId, req.body, req.headers.referer);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getEmailRecipients: async (req, res, next) => {
    try {
      const response = await service.getEmailRecipients(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  addEmailRecipients: async (req, res, next) => {
    try {
      const response = await service.addEmailRecipients(req.params.formSubmissionId, req.body.emailRecipients);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

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
      const submission = await service.read(req.params.formSubmissionId);
      const template = await formService.documentTemplateRead(req.params.documentTemplateId);
      const fileName = template.filename.substring(0, template.filename.lastIndexOf('.'));
      const fileExtension = template.filename.substring(template.filename.lastIndexOf('.') + 1);
      const convertTo = req.query.convertTo || 'pdf';

      const templateBody = {
        data: {
          ...submission.submission.submission.data,
          chefs: {
            confirmationId: submission.submission.confirmationId,
            formVersion: submission.version.version,
            submissionId: submission.submission.id,
          },
        },
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

      const { data, headers, status } = await cdogsService.templateUploadAndRender(templateBody);
      const contentDisposition = headers['content-disposition'];

      res
        .status(status)
        .set({
          'Content-Disposition': contentDisposition ? contentDisposition : 'attachment',
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
      const submission = await service.read(req.params.formSubmissionId);
      const templateBody = {
        ...req.body,
        data: {
          ...submission.submission.submission.data,
          chefs: {
            confirmationId: submission.submission.confirmationId,
            formVersion: submission.version.version,
            submissionId: submission.submission.id,
          },
        },
      };
      const { data, headers, status } = await cdogsService.templateUploadAndRender(templateBody);
      const contentDisposition = headers['content-disposition'];

      res
        .status(status)
        .set({
          'Content-Disposition': contentDisposition ? contentDisposition : 'attachment',
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
      const { data, headers, status } = await cdogsService.templateUploadAndRender(templateBody);
      const contentDisposition = headers['content-disposition'];

      res
        .status(status)
        .set({
          'Content-Disposition': contentDisposition ? contentDisposition : 'attachment',
          'Content-Type': headers['content-type'],
        })
        .send(data);
    } catch (error) {
      next(error);
    }
  },

  listEdits: async (req, res, next) => {
    try {
      const response = await service.listEdits(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
