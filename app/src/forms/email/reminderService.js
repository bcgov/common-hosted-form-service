
const { getAvailableDates } = require('../common/utils');
const exportService  = require('../form/exportService');
const { Form } = require('../common/models');
const moment = require('moment');
const service = {
  _getCurrentPeriod(dates) {
    var now = moment().format('YYYY-MM-DD HH:MM:SS');

    for (let i = 0; i<dates.length; i++) {
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
  _listDates: (schedule) =>{
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
          obj.avalaibleDate = service._listDates(forms[i].schedule);
          if (obj.avalaibleDate.length<=1) {
            continue ;
          }
          obj.report = service._getCurrentPeriod(obj.avalaibleDate);
          obj.formId = forms[i].id;
          obj.formName = forms[i].name;
          if (obj.report .state != 1 || obj.report.index <= 0) continue;
          reminder.push(exportService._getListSubmitersByFormId(forms[i].id, obj));
        }

      });
    return reminder;
  },
  runQueries : (queries) => {
    var obj = queries[2];
    queries[0].then(async function(passed_data) {
      obj.passed_submiters = passed_data;
    });
    queries[1].then(async function(data) {
      obj.current_submiters = data;
    });

    return obj;
  },
  getDifference : (array1, array2) => {
    return array1.filter(object1 => {
      return !array2.some(object2 => {
        return object1.userId === object2.userId;
      });
    });
  },
  initStatement : (query) => {
    var obj = service.runQueries(query);
  }
};

module.exports = service;
