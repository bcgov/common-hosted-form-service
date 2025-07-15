const reminderService = require('../email/reminderService');
const service = {
  sendReminderToSubmitter: async () => {
    return await reminderService._init();
  },
};

module.exports = service;
