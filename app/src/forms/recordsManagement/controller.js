const service = require('./service');
const log = require('../../components/log')(module.filename);

module.exports = {
  listRetentionClassifications: async (req, res, next) => {
    try {
      const classifications = await service.listRetentionClassifications();
      res.status(200).json(classifications);
    } catch (err) {
      log.error('listRetentionClassifications error', err);
      next(err);
    }
  },

  scheduleDeletion: async (req, res, next) => {
    try {
      const { formSubmissionId } = req.params;
      const { formId } = req.body;
      const user = req.user?.usernameIdp || 'system';
      const result = await service.scheduleDeletion(formSubmissionId, formId, user);
      res.status(200).json(result);
    } catch (err) {
      if (err.name === 'NotFoundError') {
        // Ignore because there is no retention policy
        return res.status(204).send();
      }
      log.error('scheduleDeletion error', err);
      next(err);
    }
  },

  cancelDeletion: async (req, res, next) => {
    try {
      const { formSubmissionId } = req.params;
      const result = await service.cancelDeletion(formSubmissionId);
      res.status(200).json(result);
    } catch (err) {
      if (err.name === 'NotFoundError') {
        // Ignore because there is no retention policy
        return res.status(204).send();
      }
      log.error('cancelDeletion error', err);
      next(err);
    }
  },

  getPolicy: async (req, res, next) => {
    try {
      const { formId } = req.params;
      const policy = await service.getRetentionPolicy(formId);
      res.status(200).json(policy);
    } catch (err) {
      log.error('getPolicy error', err);
      next(err);
    }
  },

  setPolicy: async (req, res, next) => {
    try {
      const { formId } = req.params;
      const user = req.user?.usernameIdp || 'system';
      const result = await service.configureRetentionPolicy(formId, req.body, user);
      res.status(200).json(result);
    } catch (err) {
      log.error('setPolicy error', err);
      next(err);
    }
  },

  processDeletions: async (req, res, next) => {
    try {
      const batchSize = req.body?.batchSize || 100;
      const result = await service.processDeletions(batchSize);
      res.status(200).json(result);
    } catch (err) {
      log.error('processDeletions error', err);
      next(err);
    }
  },

  processDeletionsWebhook: async (req, res, next) => {
    try {
      const { submissionIds = [] } = req.body;
      if (!Array.isArray(submissionIds)) {
        return res.status(400).json({ error: 'submissionIds must be an array' });
      }
      const results = await service.hardDeleteSubmissions(submissionIds);
      res.status(200).json({ results });
    } catch (err) {
      log.error('processDeletionsWebhook error', err);
      next(err);
    }
  },
};
