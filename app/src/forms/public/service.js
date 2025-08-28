const reminderService = require('../email/reminderService');
const deletionService = require('../submission/deletionService');

const service = {
  sendReminderToSubmitter: async () => {
    return await reminderService._init();
  },

  processHardDeletions: async (options) => {
    return await deletionService.processHardDeletions(options);
  },
};

module.exports = service;
