const emailService = require('../email/emailService');
const formService = require('../submission/service');
const service = require('./service');
module.exports = {
  list: async (req, res, next) => {
    try {
      const response = await service.list();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  create: async (req, res, next) => {
    try {
      const response = await service.create(req.body);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  read: async (req, res, next) => {
    try {
      const response = await service.read(req.params.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const response = await service.update(req.params.id, req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  delete: async (req, res, next) => {
    try {
      const response = await service.delete(req.params.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getCurrentUser: async (req, res, next) => {
    try {
      const response = await service.getCurrentUser(req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getCurrentUserForms: async (req, res, next) => {
    try {
      const response = await service.getCurrentUserForms(req.currentUser, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getCurrentUserSubmissions: async (req, res, next) => {
    try {
      const response = await service.getCurrentUserSubmissions(req.currentUser, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getFormUsers: async (req, res, next) => {
    try {
      const response = await service.getFormUsers(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  setFormUsers: async (req, res, next) => {
    try {
      const response = await service.setFormUsers(req.query.formId, req.query.userId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  removeMultiUsers: async (req, res, next) => {
    try {
      const response = await service.removeMultiUsers(req.query.formId, req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getSubmissionUsers: async (req, res, next) => {
    try {
      const response = await service.getSubmissionUsers(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  setSubmissionUserPermissions: async (req, res, next) => {
    try {
      const submission = await formService.read(req.query.formSubmissionId, req.currentUser);
      const response = await service.modifySubmissionUser(req.query.formSubmissionId, req.query.userId, req.body, req.currentUser);
      if (req.body && Array.isArray(req.body.permissions) && req.query.selectedUserEmail) {
        // Check if we are adding or removing a user from the draft invite list. empty permissions signifies that we are removing permissions from a user.
        if (req.body.permissions.length) {
          emailService.submissionAssigned(submission.form.id, response[0], req.query.selectedUserEmail, req.headers.referer);
        } else {
          emailService.submissionUnassigned(submission.form.id, response[0], req.query.selectedUserEmail, req.headers.referer);
        }
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getUserForms: async (req, res, next) => {
    try {
      const response = await service.getUserForms(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  setUserForms: async (req, res, next) => {
    try {
      const response = await service.setUserForms(req.query.userId, req.query.formId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  getIdentityProviders: async (req, res, next) => {
    try {
      const response = await service.getIdentityProviders(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
