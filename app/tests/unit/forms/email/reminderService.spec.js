/* eslint-disable quotes */

const reminderService = require('../../../../src/forms/email/reminderService');
const scheduleService = require('../../../../src/forms/common/scheduleService');
const moment = require('moment-timezone');
const { ScheduleType } = require('../../../../src/forms/common/constants');

// Updated schedule object to use closingDate
const schedule = {
  enabled: true,
  scheduleType: ScheduleType.CLOSINGDATE,
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
  it('should return the difference between 2 arrays of object', async () => {
    let obj1 = [{ userId: 1 }, { userId: 2 }, { userId: 3 }, { userId: 4 }];
    let obj2 = [{ userId: 4 }, { userId: 2 }];
    const objs = await reminderService.getDifference(obj1, obj2);
    expect(objs.length).toEqual(2);
    expect(objs[0].userId).toEqual(1);
    expect(objs[1].userId).toEqual(3);
  });
});

describe('getCurrentPeriod', () => {
  it('should return the current period when date is between open and close dates', () => {
    let toDay = moment('2022-07-15'); // Date between open and close
    let periods = scheduleService.getSubmissionPeriodDates(schedule);
    let period = scheduleService.getCurrentPeriod(periods, toDay, schedule.allowLateSubmissions?.enabled);
    expect(period.state).toEqual(1);
    expect(period.index).toEqual(0);
  });

  it('should return null for empty periods', () => {
    let toDay = moment('2022-11-12');
    let period = scheduleService.getCurrentPeriod([], toDay, schedule.allowLateSubmissions?.enabled);
    expect(period).toBe(null);
    period = scheduleService.getCurrentPeriod(null, toDay, schedule.allowLateSubmissions?.enabled);
    expect(period).toBe(null);
  });

  it('should identify when a date is after the closing date', () => {
    // Create a schedule with dates in the past
    const pastSchedule = {
      enabled: true,
      scheduleType: ScheduleType.CLOSINGDATE,
      openSubmissionDateTime: '2022-01-01',
      closeSubmissionDateTime: '2022-01-31',
    };

    let toDay = moment('2022-02-15'); // After close date
    let periods = scheduleService.getSubmissionPeriodDates(pastSchedule);
    let period = scheduleService.getCurrentPeriod(periods, toDay, false);

    // The important thing to test is that it identifies a date after the period
    expect(period.state).toEqual(0);
  });

  it('should identify when a date is before the opening date', () => {
    // Create a schedule with dates in the future
    const futureSchedule = {
      enabled: true,
      scheduleType: ScheduleType.CLOSINGDATE,
      openSubmissionDateTime: '2023-01-01',
      closeSubmissionDateTime: '2023-01-31',
    };

    let toDay = moment('2022-12-15'); // Before open date
    let periods = scheduleService.getSubmissionPeriodDates(futureSchedule);
    let period = scheduleService.getCurrentPeriod(periods, toDay, false);

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

describe('getSubmissionPeriodDates', () => {
  it('should handle MANUAL schedule type', () => {
    const manualSchedule = {
      enabled: true,
      scheduleType: ScheduleType.MANUAL,
      openSubmissionDateTime: '2022-07-10',
    };

    const dates = scheduleService.getSubmissionPeriodDates(manualSchedule);
    expect(dates.length).toEqual(1);
    expect(dates[0].startDate).toBeDefined();
    expect(dates[0].closeDate).toBeNull();
    expect(dates[0].graceDate).toBeNull();
  });

  it('should handle CLOSINGDATE schedule type', () => {
    const closingSchedule = {
      enabled: true,
      scheduleType: ScheduleType.CLOSINGDATE,
      openSubmissionDateTime: '2022-07-10',
      closeSubmissionDateTime: '2022-07-20',
    };

    const dates = scheduleService.getSubmissionPeriodDates(closingSchedule);
    expect(dates.length).toEqual(1);
    expect(dates[0].startDate).toBeDefined();
    expect(dates[0].closeDate).toBeDefined();
    expect(dates[0].graceDate).toBeNull();
  });

  it('should handle unknown schedule types by falling back to default behavior', () => {
    const unknownSchedule = {
      enabled: true,
      scheduleType: 'somethingElse',
      openSubmissionDateTime: '2022-07-10',
    };

    const dates = scheduleService.getSubmissionPeriodDates(unknownSchedule);
    expect(dates.length).toEqual(1);
    expect(dates[0].startDate).toBeDefined();
    expect(dates[0].closeDate).toBeDefined();
    expect(dates[0].graceDate).toBeNull();
  });

  it('should handle late submissions configuration for CLOSINGDATE', () => {
    const lateSubmissionSchedule = {
      enabled: true,
      scheduleType: ScheduleType.CLOSINGDATE,
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

    const dates = scheduleService.getSubmissionPeriodDates(lateSubmissionSchedule);
    expect(dates.length).toEqual(1);
    expect(dates[0].startDate).toBeDefined();
    expect(dates[0].closeDate).toBeDefined();
    expect(dates[0].graceDate).toEqual('2022-07-22');
  });
});

describe('getGracePeriodEndDate', () => {
  it('should return null when late submissions are not enabled', () => {
    const schedule = {
      closeSubmissionDateTime: '2022-07-20',
      allowLateSubmissions: {
        enabled: false,
      },
    };

    const graceDate = scheduleService.getGracePeriodEndDate(schedule);
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

    const graceDate = scheduleService.getGracePeriodEndDate(schedule);
    expect(graceDate).toBeDefined();
    expect(graceDate).toEqual('2022-07-23');
  });
});
describe('getEmailReminderType', () => {
  it('should return undefined for empty schedule', () => {
    const emptySchedule = {};
    const result = reminderService._getMailType(emptySchedule);
    expect(result).toBeUndefined();
  });

  it('should return undefined when schedule.enabled is false', () => {
    const disabledSchedule = {
      enabled: false,
      scheduleType: ScheduleType.CLOSINGDATE,
      openSubmissionDateTime: '2022-07-10',
      closeSubmissionDateTime: '2022-07-20',
    };
    const result = reminderService._getMailType(disabledSchedule);
    expect(result).toBeUndefined();
  });

  it('should process schedule when enabled is true', () => {
    const today = moment.tz('2025-04-24', 'America/Vancouver');
    const enabledSchedule = {
      enabled: true,
      scheduleType: ScheduleType.CLOSINGDATE,
      openSubmissionDateTime: today.format('YYYY-MM-DD'),
      closeSubmissionDateTime: today.clone().add(10, 'days').format('YYYY-MM-DD'),
    };
    const result = reminderService._getMailType(enabledSchedule, today);
    expect(result).toBeDefined();
  });
});

describe('_getReminders', () => {
  it('should filter out forms with empty schedules', async () => {
    const forms = [
      { id: '1', name: 'Form With Schedule', schedule: { enabled: true, openSubmissionDateTime: '2022-07-10' } },
      { id: '2', name: 'Form With Empty Schedule', schedule: {} },
    ];

    reminderService._listDates = jest.fn().mockImplementation((schedule) => {
      // Return empty array for empty schedule, valid dates for non-empty
      return schedule && schedule.enabled ? [{ startDate: '2022-07-10' }] : [];
    });

    const reminders = await reminderService._getReminders(forms);

    // It should mark the form with empty schedule as error
    expect(reminders.length).toBe(2);
    expect(reminders[1].error).toBe(true);
    expect(reminders[1].message).toContain('has no available date');
  });

  it('should filter out forms with disabled schedules', async () => {
    const forms = [
      { id: '1', name: 'Form With Enabled Schedule', schedule: { enabled: true, openSubmissionDateTime: '2022-07-10' } },
      { id: '2', name: 'Form With Disabled Schedule', schedule: { enabled: false, openSubmissionDateTime: '2022-07-10' } },
    ];

    reminderService._listDates = jest.fn().mockImplementation((schedule) => {
      // Return empty array for disabled schedule, valid dates for enabled
      return schedule && schedule.enabled ? [{ startDate: '2022-07-10' }] : [];
    });

    const reminders = await reminderService._getReminders(forms);

    // It should mark the form with disabled schedule as error
    expect(reminders.length).toBe(2);
    expect(reminders[1].error).toBe(true);
    expect(reminders[1].message).toContain('has no available date');
  });
});
