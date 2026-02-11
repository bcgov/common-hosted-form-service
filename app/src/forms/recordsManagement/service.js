const config = require('config');
const localService = require('./localService');
// future: const externalService = require('./externalService');

const implementation = (config.has('recordsManagement.implementation') && config.get('recordsManagement.implementation')) || 'local';

const service = {
  listRetentionClassifications: async () => {
    if (implementation === 'local') {
      return localService.listRetentionClassifications();
    }
    throw new Error(`RecordsManagement implementation '${implementation}' not available`);
  },

  getRetentionPolicy: async (formId) => {
    if (implementation === 'local') {
      return localService.getRetentionPolicy(formId);
    }
    throw new Error(`RecordsManagement implementation '${implementation}' not available`);
  },

  configureRetentionPolicy: async (formId, policyData, user) => {
    if (implementation === 'local') {
      return localService.configureRetentionPolicy(formId, policyData, user);
    }
    throw new Error(`RecordsManagement implementation '${implementation}' not available`);
  },

  deleteRetentionPolicy: async (formId, user) => {
    if (implementation === 'local') {
      return localService.deleteRetentionPolicy(formId, user);
    }
    throw new Error(`RecordsManagement implementation '${implementation}' not available`);
  },

  scheduleDeletion: async (submissionId, formId, user) => {
    if (implementation === 'local') {
      return localService.scheduleDeletion(submissionId, formId, user);
    }
    throw new Error(`RecordsManagement implementation '${implementation}' not available`);
  },

  cancelDeletion: async (submissionId) => {
    if (implementation === 'local') {
      return localService.cancelDeletion(submissionId);
    }
    throw new Error(`RecordsManagement implementation '${implementation}' not available`);
  },

  processDeletions: async (batchSize = 100) => {
    if (implementation === 'local') {
      return localService.processDeletions(batchSize);
    }
    throw new Error(`RecordsManagement implementation '${implementation}' not available`);
  },

  hardDeleteSubmissions: async (submissionIds) => {
    if (implementation === 'local') {
      return localService.hardDeleteSubmissions(submissionIds);
    }
    throw new Error(`RecordsManagement implementation '${implementation}' not available`);
  },
};

module.exports = service;
