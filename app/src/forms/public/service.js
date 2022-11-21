
const reminderService  = require('../email/reminderService');
const service = {

  sendReminderToSubmitter: async (req)=> {
    const forms = await reminderService._getForms();
    const q     = await reminderService._getReminders(forms);
    const referer = reminderService._getReferer(req);
    const resolve = [];
    const errors = [];
    var mail = 0;
    if(q.length!==0) {
      for(let i = 0 ; i < q.length ; i++) {
        if(!q[i].error){
          const obj = await  reminderService._runQueries(q[i].statement);
          let result = await reminderService._initStatement(obj);
          reminderService._initMaillSender(result, referer);
          resolve.push({
            formId:result.form.id,
            formName :  result.form.name,
            type_mail : result.state,
            number_mail: result.submiters.length
          });
          // eslint-disable-next-line no-unused-vars
          mail+= result.submiters.length;
        } else{
          errors.push(q[i].message);
        }
      }
      return {
        messsage: `${q.length} Forms found , ${mail} mails sent.`,
        errors,
        resolve
      };
    }
    else {
      return {
        messsage: '0 email sent',
        data: q,
      };
    }
  }
};

module.exports = service;
