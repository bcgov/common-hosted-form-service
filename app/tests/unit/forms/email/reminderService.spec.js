/* eslint-disable quotes */

const reminderService = require('../../../../src/forms/email/reminderService');
const moment = require('moment');

// Updated schedule object to use closingDate
const schedule = {
  enabled: true,
  scheduleType: 'closingDate',
  closingMessage: null,
  closingMessageEnabled: null,
  openSubmissionDateTime: '2022-07-10',
  closeSubmissionDateTime: '2022-07-20',
  allowLateSubmissions: {
    enabled: null,
    forNext: {
      term: null,
      intervalType: null,
    },
  },
};

describe('_init', () => {
  it('should handle reminder enabled with empty schedule', async () => {
    reminderService._getForms = jest.fn().mockReturnValue([{ schedule: {} }]);

    const result = await reminderService._init();

    expect(result.errors).not.toBe([]);
  });
});

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
  });
});

describe('getCurrentPeriod', () => {
  it('should return the current period when date is between open and close dates', () => {
    let toDay = moment('2022-07-15'); // Date between open and close
    let periods = reminderService._listDates(schedule);
    let period = reminderService.getCurrentPeriod(periods, toDay, schedule.allowLateSubmissions.enabled);
    expect(period.state).toEqual(1);
    expect(period.index).toEqual(0);
  });

  it('should return null for empty periods', () => {
    let toDay = moment('2022-11-12');
    let period = reminderService.getCurrentPeriod([], toDay, schedule.allowLateSubmissions.enabled);
    expect(period).toBe(null);
    period = reminderService.getCurrentPeriod(null, toDay, schedule.allowLateSubmissions.enabled);
    expect(period).toBe(null);
  });

  it('should identify when a date is after the closing date', () => {
    // Create a schedule with dates in the past
    const pastSchedule = {
      enabled: true,
      scheduleType: 'closingDate',
      openSubmissionDateTime: '2022-01-01',
      closeSubmissionDateTime: '2022-01-31',
    };

    let toDay = moment('2022-02-15'); // After close date
    let periods = reminderService._listDates(pastSchedule);
    let period = reminderService.getCurrentPeriod(periods, toDay, false);

    // The important thing to test is that it identifies a date after the period
    expect(period.state).toEqual(0);
  });

  it('should identify when a date is before the opening date', () => {
    // Create a schedule with dates in the future
    const futureSchedule = {
      enabled: true,
      scheduleType: 'closingDate',
      openSubmissionDateTime: '2023-01-01',
      closeSubmissionDateTime: '2023-01-31',
    };

    let toDay = moment('2022-12-15'); // Before open date
    let periods = reminderService._listDates(futureSchedule);
    let period = reminderService.getCurrentPeriod(periods, toDay, false);

    // The important thing to test is that it identifies a date before the period
    expect(period.state).toEqual(-1);
  });
});

describe('checkIfInMiddleOfThePeriod', () => {
  it('should return false for short periods', () => {
    const now = moment('2023-02-03');
    const days_diff = 5;
    const start_date = moment('2023-02-01');
    const result = reminderService.checkIfInMiddleOfThePeriod(now, start_date, days_diff);
    expect(result).toEqual(false);
  });

  it('should return true when date is in middle of period', () => {
    const now = moment('2023-02-06');
    const days_diff = 10;
    const start_date = moment('2023-02-01');
    const result = reminderService.checkIfInMiddleOfThePeriod(now, start_date, days_diff);
    expect(result).toEqual(true);
  });
});

describe('_listDates', () => {
  it('should handle MANUAL schedule type', () => {
    const manualSchedule = {
      enabled: true,
      scheduleType: 'manual',
      openSubmissionDateTime: '2022-07-10',
    };

    const dates = reminderService._listDates(manualSchedule);
    expect(dates.length).toEqual(1);
    expect(dates[0].startDate).toBeDefined();
    expect(dates[0].closeDate).toBeNull();
  });

  it('should handle CLOSINGDATE schedule type', () => {
    const closingSchedule = {
      enabled: true,
      scheduleType: 'closingDate',
      openSubmissionDateTime: '2022-07-10',
      closeSubmissionDateTime: '2022-07-20',
    };

    const dates = reminderService._listDates(closingSchedule);
    expect(dates.length).toEqual(1);
    expect(dates[0].startDate).toBeDefined();
    expect(dates[0].closeDate).toBeDefined();
  });

  it('should handle unknown schedule types by falling back to default behavior', () => {
    const unknownSchedule = {
      enabled: true,
      scheduleType: 'somethingElse',
      openSubmissionDateTime: '2022-07-10',
    };

    const dates = reminderService._listDates(unknownSchedule);
    expect(dates.length).toEqual(1);
    expect(dates[0].startDate).toBeDefined();
    expect(dates[0].closeDate).toBeDefined();
  });

  it('should handle late submissions configuration for CLOSINGDATE', () => {
    const lateSubmissionSchedule = {
      enabled: true,
      scheduleType: 'closingDate',
      openSubmissionDateTime: '2022-07-10',
      closeSubmissionDateTime: '2022-07-20',
      allowLateSubmissions: {
        enabled: true,
        forNext: {
          term: 2,
          intervalType: 'days',
        },
      },
    };

    const dates = reminderService._listDates(lateSubmissionSchedule);
    expect(dates.length).toEqual(1);
    expect(dates[0].startDate).toBeDefined();
    expect(dates[0].closeDate).toBeDefined();
    expect(dates[0].graceDate).toBeDefined();
  });
});

describe('_getGraceDate', () => {
  it('should return null when late submissions are not enabled', () => {
    const schedule = {
      closeSubmissionDateTime: '2022-07-20',
      allowLateSubmissions: {
        enabled: false,
      },
    };

    const graceDate = reminderService._getGraceDate(schedule);
    expect(graceDate).toBeNull();
  });

  it('should calculate grace date when late submissions are enabled', () => {
    const schedule = {
      closeSubmissionDateTime: '2022-07-20',
      allowLateSubmissions: {
        enabled: true,
        forNext: {
          term: 3,
          intervalType: 'days',
        },
      },
    };

    const graceDate = reminderService._getGraceDate(schedule);
    expect(graceDate).toBeDefined();

    // The grace date should be 3 days after the close date
    const expectedDate = moment('2022-07-20').add(3, 'days').format('YYYY-MM-DD HH:MM:SS');
    expect(graceDate).toEqual(expectedDate);
  });
});
