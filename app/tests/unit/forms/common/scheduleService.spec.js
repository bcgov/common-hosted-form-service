const moment = require('moment-timezone');
const scheduleService = require('../../../../src/forms/common/scheduleService');
const { ScheduleType } = require('../../../../src/forms/common/constants');
jest.mock('moment-timezone', () => {
  const moment = jest.requireActual('moment-timezone');
  return moment;
});

describe('ScheduleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    moment.tz.setDefault('America/Vancouver');
  });

  it('checkIsFormExpired should return the default result object { allowLateSubmissions: false, expire: false, message: "" }', () => {
    expect(scheduleService.checkIsFormExpired()).toEqual({ allowLateSubmissions: false, expire: false, message: '' });
  });

  it('checkIsFormExpired should return a message that the form is not available yet if the open time is a future date', () => {
    expect(
      scheduleService.checkIsFormExpired({
        enabled: true,
        allowLateSubmissions: {
          enabled: false,
        },
        openSubmissionDateTime: moment().add(1, 'days').format('YYYY-MM-DD'),
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: true,
      message: 'This form is not yet available for submission.',
    });
  });

  it('checkIsFormExpired should return a valid object for a manual schedule with a valid schedule', () => {
    expect(
      scheduleService.checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.MANUAL,
        allowLateSubmissions: {
          enabled: false,
        },
        openSubmissionDateTime: moment().subtract(1, 'days').format('YYYY-MM-DD'),
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: false,
      message: '',
    });
  });

  it('checkIsFormExpired should append a closing message if it is enabled and a valid object for a valid schedule', () => {
    // Create a reference time that is definitely between the open and close dates
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');

    const result = scheduleService.checkIsFormExpired({
      enabled: true,
      scheduleType: ScheduleType.CLOSINGDATE,
      closingMessageEnabled: true,
      closingMessage: 'closing message',
      allowLateSubmissions: {
        enabled: false,
      },
      openSubmissionDateTime: yesterday,
      openSubmissionTime: '00:00',
      closeSubmissionDateTime: tomorrow,
      closeSubmissionTime: '23:59',
      timezone: 'UTC',
    });

    expect(result).toEqual({
      allowLateSubmissions: false,
      expire: false,
      message: 'closing message',
    });
  });

  it('checkIsFormExpired should return expired for a past closing date with no late submissions', () => {
    const formSchedule = {
      enabled: true,
      scheduleType: ScheduleType.CLOSINGDATE,
      allowLateSubmissions: { enabled: false },
      openSubmissionDateTime: '2025-03-30',
      openSubmissionTime: '00:00',
      closeSubmissionDateTime: '2025-03-31',
      closeSubmissionTime: '23:59',
      timezone: 'UTC',
    };

    // Use a reference time that's clearly after the closing date in UTC
    const currentTime = moment.utc('2025-04-02 12:00');

    expect(scheduleService.checkIsFormExpired(formSchedule, currentTime)).toEqual({
      allowLateSubmissions: false,
      expire: true,
      message: '',
    });
  });

  it('checkIsFormExpired should return expired but allow late submissions within grace period', () => {
    // Mock the current date to a specific time within the grace period
    const realNow = moment.now;

    try {
      moment.now = () => new Date('2025-04-02T12:00:00Z').getTime();

      const formSchedule = {
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        allowLateSubmissions: {
          enabled: true,
          forNext: { term: 2, intervalType: 'days' },
        },
        openSubmissionDateTime: '2025-03-30',
        openSubmissionTime: '00:00',
        closeSubmissionDateTime: '2025-03-31',
        closeSubmissionTime: '23:59',
        timezone: 'UTC',
      };

      expect(scheduleService.checkIsFormExpired(formSchedule)).toEqual({
        allowLateSubmissions: true,
        expire: true,
        message: '',
      });
    } finally {
      // Restore the original moment.now function
      moment.now = realNow;
    }
  });

  // Critical date calculations
  it('isDateInRange should accurately determine if a date is within range across timezone boundaries', () => {
    // Using the entire day as the range
    const startDate = '2023-06-15T00:00:00';
    const endDate = '2023-06-15T23:59:59';

    // A time that's within the day in Vancouver
    const vancouverDate = '2023-06-15T08:00:00';

    // In Vancouver timezone, this should be in range
    expect(scheduleService.isDateInRange(vancouverDate, startDate, endDate, 'America/Vancouver', false)).toBe(true);

    // A time that would be the next day in Tokyo
    const tokyoLocalTime = '2023-06-16T00:30:00';

    // In Tokyo timezone, this should be outside range (it's the next day)
    expect(scheduleService.isDateInRange(tokyoLocalTime, startDate, endDate, 'Asia/Tokyo', false)).toBe(false);
  });

  it('getCurrentPeriod should properly handle date comparisons with timezone awareness', () => {
    // Create a schedule with a specific timezone
    const schedule = {
      scheduleType: ScheduleType.CLOSINGDATE,
      enabled: true,
      openSubmissionDateTime: '2023-06-15',
      closeSubmissionDateTime: '2023-06-20',
      timezone: 'Europe/London',
    };

    const beforeOpeningDate = moment.tz('2023-06-14T12:00:00', 'Europe/London');

    // Test period state correctly identifies before/during/after
    const beforePeriod = scheduleService.getCurrentPeriod(schedule, beforeOpeningDate, true);
    expect(beforePeriod.state).toBe(-1); // Before period

    const duringPeriod = scheduleService.getCurrentPeriod(schedule, '2023-06-17', false);
    expect(duringPeriod.state).toBe(1); // During period

    const afterPeriod = scheduleService.getCurrentPeriod(schedule, '2023-06-21', false);
    expect(afterPeriod.state).toBe(0); // After period
  });

  it('should handle late submission grace periods correctly', () => {
    // Create a schedule with late submissions enabled
    const schedule = {
      scheduleType: ScheduleType.CLOSINGDATE,
      enabled: true,
      openSubmissionDateTime: '2023-06-15',
      closeSubmissionDateTime: '2023-06-20',
      allowLateSubmissions: {
        enabled: true,
        forNext: {
          term: 2,
          intervalType: 'days',
        },
      },
      timezone: 'UTC',
    };

    // Test with a date during the grace period
    const gracePeriodDate = '2023-06-21';
    const period = scheduleService.getCurrentPeriod(schedule, gracePeriodDate, false);

    // Should be active but in late submission mode
    expect(period.state).toBe(1);
    expect(period.late).toBe(1);

    // Test after grace period has ended
    const afterGracePeriod = '2023-06-23';
    const expiredPeriod = scheduleService.getCurrentPeriod(schedule, afterGracePeriod, false);

    // Should be inactive
    expect(expiredPeriod.state).toBe(0);
  });

  it('middle date calculation should be correct for various period lengths', () => {
    // Short period (5 days) - should return null
    expect(scheduleService.calculateMiddleDate('2023-06-01', '2023-06-05', 'UTC')).toBeNull();

    // Medium period (10 days) - should return day 5
    const mediumResult = scheduleService.calculateMiddleDate('2023-06-01', '2023-06-10', 'UTC', 'YYYY-MM-DD');
    expect(mediumResult).toBe('2023-06-05');

    // Long period (30 days) - should return day 15
    const longResult = scheduleService.calculateMiddleDate('2023-06-01', '2023-06-30', 'UTC', 'YYYY-MM-DD');
    expect(longResult).toBe('2023-06-15');
  });

  // Period dates extraction
  describe('getSubmissionPeriodDates', () => {
    it('returns empty array for disabled or invalid schedule', () => {
      expect(scheduleService.getSubmissionPeriodDates()).toEqual([]);
      expect(scheduleService.getSubmissionPeriodDates({ enabled: false })).toEqual([]);
    });

    it('returns period for MANUAL schedule', () => {
      const schedule = {
        enabled: true,
        scheduleType: ScheduleType.MANUAL,
        openSubmissionDateTime: '2023-03-01',
      };
      expect(scheduleService.getSubmissionPeriodDates(schedule)).toEqual([
        {
          startDate: '2023-03-01',
          closeDate: null,
          graceDate: null,
          timezone: 'America/Vancouver',
        },
      ]);
    });

    it('returns period with grace date for CLOSINGDATE schedule', () => {
      const schedule = {
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        openSubmissionDateTime: '2023-03-01',
        closeSubmissionDateTime: '2023-03-31',
        allowLateSubmissions: {
          enabled: true,
          forNext: { term: 5, intervalType: 'days' },
        },
      };
      expect(scheduleService.getSubmissionPeriodDates(schedule)).toEqual([
        {
          startDate: '2023-03-01',
          closeDate: '2023-03-31',
          graceDate: '2023-04-05',
          timezone: 'America/Vancouver',
        },
      ]);
    });
  });
  it('should handle submissions at timezone boundaries correctly', () => {
    // Create a schedule that closes at midnight
    const schedule = {
      enabled: true,
      scheduleType: ScheduleType.CLOSINGDATE,
      openSubmissionDateTime: '2023-08-01',
      openSubmissionTime: '00:00',
      closeSubmissionDateTime: '2023-08-31',
      closeSubmissionTime: '23:59',
      timezone: 'America/Vancouver',
    };

    // Mock the current time
    const realNow = moment.now;
    try {
      // Set current time to 11:30pm on the closing date in Vancouver
      moment.now = () => new Date('2023-08-31T23:30:00-07:00').getTime(); // Vancouver time

      const result = scheduleService.checkIsFormExpired(schedule);
      expect(result.expire).toBe(false);

      // Test after closing time
      moment.now = () => new Date('2023-09-01T00:01:00-07:00').getTime(); // Just past midnight
      const expiredResult = scheduleService.checkIsFormExpired(schedule);
      expect(expiredResult.expire).toBe(true);
    } finally {
      moment.now = realNow;
    }
  });

  describe('daysBetween', () => {
    it('should return 0 for invalid or missing dates', () => {
      expect(scheduleService.daysBetween(null, '2023-06-15', 'UTC')).toBe(0);
      expect(scheduleService.daysBetween('2023-06-15', null, 'UTC')).toBe(0);
      expect(scheduleService.daysBetween(null, null, 'UTC')).toBe(0);
    });

    it('should calculate days between two dates ignoring time', () => {
      expect(scheduleService.daysBetween('2023-06-15', '2023-06-20', 'UTC')).toBe(5);
      expect(scheduleService.daysBetween('2023-06-15T12:00:00', '2023-06-15T23:59:59', 'UTC', true)).toBe(0);
    });

    it('should calculate days with time component', () => {
      expect(scheduleService.daysBetween('2023-06-15T00:00:00', '2023-06-16T00:00:00', 'UTC', false)).toBe(1);
    });
  });

  describe('isSameDay', () => {
    it('should return false for invalid or missing dates', () => {
      expect(scheduleService.isSameDay(null, '2023-06-15', 'UTC')).toBe(false);
      expect(scheduleService.isSameDay('2023-06-15', null, 'UTC')).toBe(false);
    });

    it('should compare same day ignoring time', () => {
      expect(scheduleService.isSameDay('2023-06-15T12:00:00', '2023-06-15T23:59:59', 'UTC', false)).toBe(true);
      expect(scheduleService.isSameDay('2023-06-15', '2023-06-16', 'UTC', false)).toBe(false);
    });

    it('should compare exact time when requested', () => {
      expect(scheduleService.isSameDay('2023-06-15T12:00:00', '2023-06-15T12:00:00', 'UTC', true)).toBe(true);
      expect(scheduleService.isSameDay('2023-06-15T12:00:00', '2023-06-15T12:01:00', 'UTC', true)).toBe(false);
    });
  });

  describe('isDateValid', () => {
    it('should validate dates correctly', () => {
      expect(scheduleService.isDateValid('2023-06-15')).toBe(true);
      expect(scheduleService.isDateValid('invalid-date')).toBe(false);
      expect(scheduleService.isDateValid(null)).toBe(false);
    });
  });

  describe('checkIsFormExpired additional cases', () => {
    it('should handle legacy period schedule type', () => {
      const schedule = {
        enabled: true,
        scheduleType: 'period',
        openSubmissionDateTime: '2023-06-15',
        keepOpenForTerm: 7,
        keepOpenForInterval: 'days',
        timezone: 'UTC',
      };
      const realNow = moment.now;
      try {
        moment.now = () => new Date('2023-06-20T12:00:00Z').getTime();
        expect(scheduleService.checkIsFormExpired(schedule)).toEqual({
          allowLateSubmissions: false,
          expire: false,
          message: '',
        });
      } finally {
        moment.now = realNow;
      }
    });

    it('should handle missing allowLateSubmissions in grace period', () => {
      const schedule = {
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        openSubmissionDateTime: '2023-06-15',
        openSubmissionTime: '00:00',
        closeSubmissionDateTime: '2023-06-20',
        closeSubmissionTime: '23:59',
        timezone: 'UTC',
      };
      const realNow = moment.now;
      try {
        moment.now = () => new Date('2023-06-21T12:00:00Z').getTime();
        expect(scheduleService.checkIsFormExpired(schedule)).toEqual({
          allowLateSubmissions: false,
          expire: true,
          message: '',
        });
      } finally {
        moment.now = realNow;
      }
    });

    it('should handle invalid schedule type', () => {
      const schedule = {
        enabled: true,
        scheduleType: 'INVALID',
        openSubmissionDateTime: '2023-06-15',
        timezone: 'UTC',
      };
      expect(scheduleService.checkIsFormExpired(schedule)).toEqual({
        allowLateSubmissions: false,
        expire: true,
        message: '',
      });
    });
  });

  describe('calculateCloseDateFromPeriod', () => {
    it('should return null for invalid schedule', () => {
      expect(scheduleService.calculateCloseDateFromPeriod({})).toBeNull();
    });

    it('should calculate default 7-day close date', () => {
      const schedule = { openSubmissionDateTime: '2023-06-15' };
      expect(scheduleService.calculateCloseDateFromPeriod(schedule)).toBe('2023-06-22');
    });

    it('should calculate close date with keepOpenForTerm', () => {
      const schedule = {
        openSubmissionDateTime: '2023-06-15',
        keepOpenForTerm: 10,
        keepOpenForInterval: 'days',
      };
      expect(scheduleService.calculateCloseDateFromPeriod(schedule)).toBe('2023-06-25');
    });
  });

  describe('isWithinGracePeriod', () => {
    it('should return false for disabled late submissions', () => {
      const schedule = {
        allowLateSubmissions: { enabled: false },
        closeSubmissionDateTime: '2023-06-20',
        closeSubmissionTime: '23:59',
        timezone: 'UTC',
      };
      const currentMoment = moment.utc('2023-06-21T12:00:00');
      expect(scheduleService.isWithinGracePeriod(schedule, currentMoment)).toBe(false);
    });

    it('should return false for missing late submission config', () => {
      const schedule = {
        allowLateSubmissions: { enabled: true },
        closeSubmissionDateTime: '2023-06-20',
        closeSubmissionTime: '23:59',
        timezone: 'UTC',
      };
      const currentMoment = moment.utc('2023-06-21T12:00:00');
      expect(scheduleService.isWithinGracePeriod(schedule, currentMoment)).toBe(false);
    });
  });

  describe('calculateMiddleDate additional cases', () => {
    it('should return null for invalid dates', () => {
      expect(scheduleService.calculateMiddleDate(null, '2023-06-15', 'UTC')).toBeNull();
      expect(scheduleService.calculateMiddleDate('2023-06-15', null, 'UTC')).toBeNull();
    });
  });

  describe('validateSubmissionSchedule', () => {
    it('should not throw when schedule is not enabled', () => {
      expect(() => {
        scheduleService.validateSubmissionSchedule({ enabled: false });
      }).not.toThrow();
    });

    it('should not throw when schedule is null or undefined', () => {
      expect(() => {
        scheduleService.validateSubmissionSchedule(null);
      }).not.toThrow();
      expect(() => {
        scheduleService.validateSubmissionSchedule(undefined);
      }).not.toThrow();
      expect(() => {
        scheduleService.validateSubmissionSchedule({});
      }).not.toThrow();
    });

    it('should throw Problem 403 when schedule is expired and late submissions not allowed', () => {
      const realNow = moment.now;
      try {
        moment.now = () => new Date('2025-04-02T12:00:00Z').getTime();
        const expiredSchedule = {
          enabled: true,
          scheduleType: ScheduleType.CLOSINGDATE,
          allowLateSubmissions: { enabled: false },
          openSubmissionDateTime: '2025-03-30',
          openSubmissionTime: '00:00',
          closeSubmissionDateTime: '2025-03-31',
          closeSubmissionTime: '23:59',
          timezone: 'UTC',
        };

        expect(() => {
          scheduleService.validateSubmissionSchedule(expiredSchedule);
        }).toThrow('Form submission period has expired');
      } finally {
        moment.now = realNow;
      }
    });

    it('should not throw when schedule is expired but late submissions are allowed', () => {
      const realNow = moment.now;
      try {
        moment.now = () => new Date('2025-04-02T12:00:00Z').getTime();
        const expiredScheduleWithLate = {
          enabled: true,
          scheduleType: ScheduleType.CLOSINGDATE,
          allowLateSubmissions: {
            enabled: true,
            forNext: { term: 2, intervalType: 'days' },
          },
          openSubmissionDateTime: '2025-03-30',
          openSubmissionTime: '00:00',
          closeSubmissionDateTime: '2025-03-31',
          closeSubmissionTime: '23:59',
          timezone: 'UTC',
        };

        expect(() => {
          scheduleService.validateSubmissionSchedule(expiredScheduleWithLate);
        }).not.toThrow();
      } finally {
        moment.now = realNow;
      }
    });

    it('should throw Problem 403 with custom message when schedule has closing message', () => {
      const realNow = moment.now;
      try {
        moment.now = () => new Date('2025-04-02T12:00:00Z').getTime();
        const expiredSchedule = {
          enabled: true,
          scheduleType: ScheduleType.CLOSINGDATE,
          allowLateSubmissions: { enabled: false },
          closingMessageEnabled: true,
          closingMessage: 'Custom closing message',
          openSubmissionDateTime: '2025-03-30',
          openSubmissionTime: '00:00',
          closeSubmissionDateTime: '2025-03-31',
          closeSubmissionTime: '23:59',
          timezone: 'UTC',
        };

        expect(() => {
          scheduleService.validateSubmissionSchedule(expiredSchedule);
        }).toThrow('Custom closing message');
      } finally {
        moment.now = realNow;
      }
    });
  });

  describe('validateFormSubmissionSchedule', () => {
    it('should not throw when form has no schedule', () => {
      expect(() => {
        scheduleService.validateFormSubmissionSchedule({});
      }).not.toThrow();
      expect(() => {
        scheduleService.validateFormSubmissionSchedule({ schedule: null });
      }).not.toThrow();
    });

    it('should validate processed schedule directly when expire property exists', () => {
      const formWithProcessedSchedule = {
        schedule: {
          expire: true,
          allowLateSubmissions: false,
          message: 'Processed schedule message',
        },
      };

      expect(() => {
        scheduleService.validateFormSubmissionSchedule(formWithProcessedSchedule);
      }).toThrow('Processed schedule message');
    });

    it('should not throw when processed schedule allows late submissions', () => {
      const formWithProcessedSchedule = {
        schedule: {
          expire: true,
          allowLateSubmissions: true,
        },
      };

      expect(() => {
        scheduleService.validateFormSubmissionSchedule(formWithProcessedSchedule);
      }).not.toThrow();
    });

    it('should process raw schedule when expire property does not exist', () => {
      const realNow = moment.now;
      try {
        moment.now = () => new Date('2025-04-02T12:00:00Z').getTime();
        const formWithRawSchedule = {
          schedule: {
            enabled: true,
            scheduleType: ScheduleType.CLOSINGDATE,
            allowLateSubmissions: { enabled: false },
            openSubmissionDateTime: '2025-03-30',
            openSubmissionTime: '00:00',
            closeSubmissionDateTime: '2025-03-31',
            closeSubmissionTime: '23:59',
            timezone: 'UTC',
          },
        };

        expect(() => {
          scheduleService.validateFormSubmissionSchedule(formWithRawSchedule);
        }).toThrow('Form submission period has expired');
      } finally {
        moment.now = realNow;
      }
    });

    it('should not throw when raw schedule is not expired', () => {
      const realNow = moment.now;
      try {
        // Set current time to be clearly within the valid submission period (midway between opening and closing)
        moment.now = () => new Date('2025-03-31T12:00:00Z').getTime();
        const formWithRawSchedule = {
          schedule: {
            enabled: true,
            scheduleType: ScheduleType.CLOSINGDATE,
            allowLateSubmissions: { enabled: false },
            openSubmissionDateTime: '2025-03-30',
            openSubmissionTime: '00:00',
            closeSubmissionDateTime: '2025-03-31',
            closeSubmissionTime: '23:59',
            timezone: 'UTC',
          },
        };

        expect(() => {
          scheduleService.validateFormSubmissionSchedule(formWithRawSchedule);
        }).not.toThrow();
      } finally {
        moment.now = realNow;
      }
    });

    it('should not throw when raw schedule is not enabled', () => {
      const formWithDisabledSchedule = {
        schedule: {
          enabled: false,
        },
      };

      expect(() => {
        scheduleService.validateFormSubmissionSchedule(formWithDisabledSchedule);
      }).not.toThrow();
    });
  });
});
