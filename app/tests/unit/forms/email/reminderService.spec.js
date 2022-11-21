/* eslint-disable quotes */

const reminderService = require('../../../../src/forms/email/reminderService');
const moment = require('moment');
//const formService = require('../../../../src/forms/form/service');
//const fs = require('fs');

const schedule  = {
  "enabled": true,
  "closingMessage": "form closed",
  "keepOpenForTerm": "10",
  "repeatSubmission": {
    "enabled": true,
    "everyTerm": "1",
    "repeatUntil": "2023-08-10",
    "keepAliveFor": null,
    "onSpecificDay": null,
    "everyIntervalType": "months"
  },
  "keepOpenForInterval": "days",
  "allowLateSubmissions": {
    "enabled": false,
    "forNext": {
      "term": null,
      "intervalType": null
    }
  },
  "openSubmissionDateTime": "2022-07-10",
  "closeSubmissionDateTime": null
};


describe('getDifference', () => {

  it('should return the difference between 2 arrays of object', () => {
    let obj1  = [{
      userId: 1
    }, {
      userId: 2
    }, {
      userId: 3
    },
    {
      userId: 4
    }
    ];
    let obj2  = [{
      userId: 4
    }, {
      userId: 2
    }
    ];
    reminderService.getDifference(obj1, obj2).then((objs)=>{
      expect(objs.length).toEqual(2);
      expect(objs[0].userId).toEqual(1);
    });
    // eslint-disable-next-line no-console

  });
});


describe('getCurrentPeriod', () => {



  it('should return the current period', () => {

    let toDay = moment('2022-09-12');
    let periodes = reminderService._listDates(schedule);
    let periode =  reminderService.getCurrentPeriod(periodes, toDay);
    expect(periode.state).toEqual(1);
    expect(periode.index).toEqual(2);
  });

  it('should return null', () => {
    let toDay = moment('2022-11-12');
    let periode =  reminderService.getCurrentPeriod([], toDay);
    expect(periode).toBe(null);
    periode =  reminderService.getCurrentPeriod([], toDay);
    expect(periode).toBe(null);
    // eslint-disable-next-line no-console
  });

  it('should return any period but the current date is after the periodes', () => {
    let toDay = moment('2023-11-12');
    let periodes = reminderService._listDates(schedule);
    let periode =  reminderService.getCurrentPeriod(periodes, toDay);
    expect(periode.state).toEqual(0);
    expect(periode.index).toEqual(-1);
  });

  it('should return any period  but the current date is before the periodes', () => {
    let toDay = moment('2021-11-12');
    let periodes = reminderService._listDates(schedule);
    let periode =  reminderService.getCurrentPeriod(periodes, toDay);
    expect(periode.state).toEqual(-1);
    expect(periode.index).toEqual(-1);
  });
});


