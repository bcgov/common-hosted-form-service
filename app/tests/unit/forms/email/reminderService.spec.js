/* eslint-disable quotes */

const reminderService = require('../../../../src/forms/email/reminderService');
const moment = require('moment');

const schedule = {
  enabled: true,
  scheduleType: 'period',
  closingMessage: null,
  keepOpenForTerm: '10',
  repeatSubmission: {
    enabled: true,
    everyTerm: '1',
    repeatUntil: '2023-08-10',
    everyIntervalType: 'months',
  },
  keepOpenForInterval: 'days',
  allowLateSubmissions: {
    enabled: null,
    forNext: {
      term: null,
      intervalType: null,
    },
  },
  closingMessageEnabled: null,
  openSubmissionDateTime: '2022-07-10',
  closeSubmissionDateTime: null,
};

describe('getDifference', () => {
  it('should return the difference between 2 arrays of object', () => {
    let obj1 = [
      {
        userId: 1,
      },
      {
        userId: 2,
      },
      {
        userId: 3,
      },
      {
        userId: 4,
      },
    ];
    let obj2 = [
      {
        userId: 4,
      },
      {
        userId: 2,
      },
    ];
    reminderService.getDifference(obj1, obj2).then((objs) => {
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
    let periode = reminderService.getCurrentPeriod(periodes, toDay, schedule.allowLateSubmissions.enabled);
    expect(periode.state).toEqual(1);
    expect(periode.index).toEqual(2);
  });

  it('should return null', () => {
    let toDay = moment('2022-11-12');
    let periode = reminderService.getCurrentPeriod([], toDay, schedule.allowLateSubmissions.enabled);
    expect(periode).toBe(null);
    periode = reminderService.getCurrentPeriod([], toDay, schedule.allowLateSubmissions.enabled);
    expect(periode).toBe(null);
    // eslint-disable-next-line no-console
  });

  it('should return any period but the current date is after the periodes', () => {
    let toDay = moment('2023-11-12');
    let periodes = reminderService._listDates(schedule);
    let periode = reminderService.getCurrentPeriod(periodes, toDay, schedule.allowLateSubmissions.enabled);
    expect(periode.state).toEqual(0);
    expect(periode.index).toEqual(-1);
  });

  it('should return any period  but the current date is before the periodes', () => {
    let toDay = moment('2021-11-12');
    let periodes = reminderService._listDates(schedule);
    let periode = reminderService.getCurrentPeriod(periodes, toDay, schedule.allowLateSubmissions.enabled);
    expect(periode.state).toEqual(-1);
    expect(periode.index).toEqual(-1);
  });
});

describe('checkIfInMiddleOfThePeriod', () => {
  it('should return the false', () => {
    const now = moment('2023-02-03');
    const days_diff = 5;
    const start_date = moment('2023-02-01');
    const result = reminderService.checkIfInMiddleOfThePeriod(now, start_date, days_diff);
    expect(result).toEqual(false);
  });

  it('should return the true', () => {
    const now = moment('2023-02-06');
    const days_diff = 10;
    const start_date = moment('2023-02-01');
    const result = reminderService.checkIfInMiddleOfThePeriod(now, start_date, days_diff);
    expect(result).toEqual(true);
  });
});
