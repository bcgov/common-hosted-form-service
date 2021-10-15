const cdogsService = require('../../components/cdogsService');
const emailService = require('../email/emailService');
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
      res.status(200).json(response);
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
      const submission = await service.read(req.params.formSubmissionId);
      const response = await service.createStatus(req.params.formSubmissionId, req.body, req.currentUser);
      // send an email (async in the background)
      if (req.body.assignmentNotificationEmail) {
        emailService.statusAssigned(submission.form.id, response[0], req.body.assignmentNotificationEmail, req.headers.referer).catch(() => { });
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
  templateUploadAndRender: async (req, res, next) => {
    try {
      const submission = await service.read(req.params.formSubmissionId);
      const templateBody = { ...req.body, data: submission.submission.submission.data };
      const { data, headers, status } = await cdogsService.templateUploadAndRender(templateBody);
      const contentDisposition = headers['content-disposition'];

      res.status(status).set({
        'Content-Disposition': contentDisposition ? contentDisposition : 'attachment',
        'Content-Type': headers['content-type']
      }).send(data);
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
