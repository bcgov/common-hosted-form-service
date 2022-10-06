
const { getAvailableDates } = require('../common/utils');
const exportService  = require('../form/exportService');
//const emailService  = require('./emailService');
const { Form } = require('../common/models');
const moment = require('moment');
const service = {
  getCurrentPeriod(dates) {
    var now = moment().format('YYYY-MM-DD HH:MM:SS');

    for (let i = 0; i <dates.length; i++) {
      if(moment(now).isBetween(dates[i].startDate, dates[i].graceDate)) {
        const rep ={
          state : 1,
          index: i ,
          dates: dates[i],
          old_dates : (i==0) ? null :  dates[i-1],
          late: (moment(now).isBetween(dates[i].closeDate, dates[i].graceDate))? 1 : 0
        };
        return rep;
      }
    }
    var first = dates[0];
    return {
      state: (moment(now).isBefore(first.startDate)) ? -1 : 0,
      index: -1,
      dates: false,
      old_dates : false,
      late: -1
    };

  },
  listDates: (schedule) =>{
    return  getAvailableDates(
      schedule.keepOpenForTerm,
      schedule.keepOpenForInterval,
      schedule.openSubmissionDateTime,
      schedule.repeatSubmission.everyTerm,
      schedule.repeatSubmission.everyIntervalType,
      schedule.allowLateSubmissions.forNext.term,
      schedule.allowLateSubmissions.forNext.intervalType,
      schedule.repeatSubmission.repeatUntil,
    );
  },
  _sendReminderToSubmitter: async ()=> {
    var reminder = [];
    await Form.query()
      .modify('hasReminder')
      .modify('filterActive', true)
      .then(forms => {
        for (let i = 0; i< forms.length; i++) {
          var obj = {};
          obj.avalaibleDate = service.listDates(forms[i].schedule);
          if (obj.avalaibleDate.length<=1) {
            continue;
          }
          obj.report = service.getCurrentPeriod(obj.avalaibleDate);
          obj.form= forms[i];
          if (obj.report.state != 1 || obj.report.index <= 0) continue;
          reminder.push(exportService._getListSubmitersByFormId(forms[i].id, obj));
        }
      });

    return reminder;
  },
  runQueries : async (queries) => {
    var obj = queries[2];
    obj.fillers = [];
    await queries[0].then(function(data) {
      obj.submiters = data;
    });
    if(obj.submiters && obj.submiters.length>0){
      await queries[1].then(function(data2) {
        obj.fillers = (data2) ? data2 : [];
      });
    }
    return  obj;
  },
  getDifference : async (array1, array2) => {
    return array1.filter(object1 => {
      return !array2.some(object2 => {
        return object1.userId === object2.userId;
      });
    });
  },
  _initStatement : async (query) => {
    const obj = await service.runQueries(query);

    const statement = {};
    statement.form = obj.form;
    statement.report = obj.report;
    if(!obj.submiters || obj.submiters.length == 0) return ;
    if(!obj.fillers || obj.fillers.length == 0) statement.submiters = obj.submiters;
    if( (obj.submiters && obj.fillers) && (obj.submiters.length != 0 && obj.fillers.length != 0) ) statement.submiters = await service.getDifference(obj.submiters, obj.fillers);
    console.log(statement);
    /// service.initMaillSender(statement);
    return;

  },
  initMaillSender: (statement) => {
    statement.submiters.forEach((element)=>{
      console.log(element);
      // emailService.formOpen({form : statement.form,report : statement.report,submiter : element});
    });
  }
};
module.exports = service;
