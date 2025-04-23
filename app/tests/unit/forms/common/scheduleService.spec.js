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
      openSubmissionTime: '00:00', // Add explicit times
      closeSubmissionDateTime: tomorrow,
      closeSubmissionTime: '23:59', // Add explicit times
      timezone: 'UTC', // Use UTC to avoid timezone issues
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
      timezone: 'UTC', // Use UTC for consistency
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
      // Mock moment.now() to return April 2, 2025 at 12:00 UTC
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
        },
      ]);
    });
  });
});
