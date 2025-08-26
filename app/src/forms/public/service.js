const reminderService = require('../email/reminderService');
const deletionService = require('../submission/deletionService');

const service = {
  sendReminderToSubmitter: async () => {
    return await reminderService._init();
  },

  processHardDeletions: async () => {
    return await deletionService.processHardDeletions();
  },
};

module.exports = service;
