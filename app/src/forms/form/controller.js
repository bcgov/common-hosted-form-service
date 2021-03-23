const emailService = require('../email/emailService');
const exportService = require('./exportService');
const service = require('./service');
const fileService = require('../file/service');

module.exports = {
  export: async (req, res, next) => {
    try {
      const result = await exportService.export(req.params.formId, req.query, req.currentUser);
      ['Content-Disposition', 'Content-Type'].forEach(h => {
        res.setHeader(h, result.headers[h.toLowerCase()]);
      });
      return res.send(result.data);
    } catch (error) {
      next(error);
    }
  },
  listForms: async (req, res, next) => {
    try {
      const response = await service.listForms(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createForm: async (req, res, next) => {
    try {
      const response = await service.createForm(req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  readForm: async (req, res, next) => {
    try {
      const response = await service.readForm(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readPublishedForm: async (req, res, next) => {
    try {
      const response = await service.readPublishedForm(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  updateForm: async (req, res, next) => {
    try {
      const response = await service.updateForm(req.params.formId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  deleteForm: async (req, res, next) => {
    try {
      const response = await service.deleteForm(req.params.formId, req.query, req.currentUser);
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  },
  listFormSubmissions: async (req, res, next) => {
    try {
      const response = await service.listFormSubmissions(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listVersions: async (req, res, next) => {
    try {
      const response = await service.listVersions(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readVersion: async (req, res, next) => {
    try {
      const response = await service.readVersion(req.params.formVersionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  publishVersion: async (req, res, next) => {
    try {
      const response = await service.publishVersion(req.params.formId, req.params.formVersionId, req.query, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listSubmissions: async (req, res, next) => {
    try {
      const response = await service.listSubmissions(req.params.formVersionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createSubmission: async (req, res, next) => {
    try {
      const response = await service.createSubmission(req.params.formVersionId, req.body, req.currentUser);
      emailService.submissionReceived(req.params.formId, response.id, req.headers.referer).catch(() => { });
      // do we want to await this? could take a while, but it could fail... maybe make an explicit api call?
      fileService.moveSubmissionFiles(response.id, req.currentUser).catch(() => { });
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  listDrafts: async (req, res, next) => {
    try {
      const response = await service.listDrafts(req.params.formId, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createDraft: async (req, res, next) => {
    try {
      const response = await service.createDraft(req.params.formId, req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  readDraft: async (req, res, next) => {
    try {
      const response = await service.readDraft(req.params.formVersionDraftId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  updateDraft: async (req, res, next) => {
    try {
      const response = await service.updateDraft(req.params.formVersionDraftId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  deleteDraft: async (req, res, next) => {
    try {
      const response = await service.deleteDraft(req.params.formVersionDraftId);
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  },
  publishDraft: async (req, res, next) => {
    try {
      const response = await service.publishDraft(req.params.formId, req.params.formVersionDraftId, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getStatusCodes: async (req, res, next) => {
    try {
      const response = await service.getStatusCodes(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

};
