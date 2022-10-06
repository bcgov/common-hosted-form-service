
const reminderService  = require('../email/reminderService');
const service = {

  sendReminderToSubmitter: async ()=> {
    var q = await reminderService._sendReminderToSubmitter();
    for(let i = 0 ; i < q.length ; i++) {
      reminderService._initStatement(q[i]);
    }
    return {
      messsage: 'Notification sent'
    };
  }
};

module.exports = service;
