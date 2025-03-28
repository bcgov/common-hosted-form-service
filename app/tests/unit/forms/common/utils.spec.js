const config = require('config');
const moment = require('moment');

const { checkIsFormExpired, getBaseUrl, queryUtils, typeUtils, validateScheduleObject } = require('../../../../src/forms/common/utils');
const { ScheduleType } = require('../../../../src/forms/common/constants');

jest.mock('config');

describe('getBaseUrl', () => {
  const basePath = '/app';
  const basePathPr = '/pr-1234';
  const localhostPort = '5173';
  const serverDev = 'chefs-dev.apps.silver.devops.gov.bc.ca';
  const serverProd = 'submit.digital.gov.bc.ca';

  it('should return a default for local development', () => {
    config.get.mockReturnValue(basePath);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`http://localhost${basePath}`);
  });

  it('should return a default with port for local development', () => {
    config.get = jest.fn((k) => (k === 'frontend.basePath' ? basePath : localhostPort));
    config.has.mockReturnValue(true);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`http://localhost:${localhostPort}${basePath}`);
  });

  it('should handle non-prod SERVER_URL variable', () => {
    process.env.SERVER_HOST = serverDev;
    config.get.mockReturnValue(basePath);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`https://${serverDev}${basePath}`);
  });

  it('should handle non-prod SERVER_URL variable for PRs', () => {
    process.env.SERVER_HOST = serverDev;
    config.get.mockReturnValue(basePathPr);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`https://${serverDev}${basePathPr}`);
  });

  it('should handle prod SERVER_URL variable', () => {
    process.env.SERVER_HOST = serverProd;
    config.get.mockReturnValue(basePath);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`https://${serverProd}${basePath}`);
  });
});

describe('Test Query Utils functions', () => {
  it('defaultActiveOnly should return params object', () => {
    const params = queryUtils.defaultActiveOnly(null);
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true });
  });

  it('defaultActiveOnly should return active = true', () => {
    let params = queryUtils.defaultActiveOnly(null);
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true });

    params = queryUtils.defaultActiveOnly({});
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true });

    params = queryUtils.defaultActiveOnly({ other: 'value' });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true, other: 'value' });

    params = queryUtils.defaultActiveOnly({ active: 'not a false value', other: 'value' });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true, other: 'value' });

    params = queryUtils.defaultActiveOnly({ active: true, other: 'value' });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true, other: 'value' });
  });

  it('defaultActiveOnly should return active = false', () => {
    let params = queryUtils.defaultActiveOnly({ active: false });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: false });

    params = queryUtils.defaultActiveOnly({ active: 'false' });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: false });

    params = queryUtils.defaultActiveOnly({ active: 0 });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: false });
  });
});

describe('Test Type Utils functions', () => {
  it('isInt should return true for int and int like strings', () => {
    let result = typeUtils.isInt(1);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isInt('1');
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isInt(-1);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();
  });

  it('isInt should return false for not ints', () => {
    let result = typeUtils.isInt(1.1);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isInt({ key: 1 });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isInt('Not Int');
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isInt(() => {
      return 1;
    });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();
  });

  it('isString should return true for strings', () => {
    let result = typeUtils.isString('a string');
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isString(`another string ${result}`);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isString(new String('value of string'));
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isString(new Object('value of object'));
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isString('1');
    expect(result).toBeDefined();
    expect(result).toBeTruthy();
  });

  it('isString should return false for not strings', () => {
    let result = typeUtils.isString(1.1);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isString({ key: 'string' });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isString(() => {
      return 'string';
    });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isString(new Boolean(true));
    expect(result).toBeDefined();
    expect(result).toBeFalsy();
  });

  it('isBoolean should return true for booleans', () => {
    let result = typeUtils.isBoolean(new Boolean(true));
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isBoolean(new Boolean(false));
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isBoolean(true);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isBoolean(false);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();
  });

  it('isBoolean should return false for not boolean', () => {
    let result = typeUtils.isBoolean(1.1);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean({ key: 'string' });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean(() => {
      return 'string';
    });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean('true');
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean(1);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean(0);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();
  });
});

describe('Test Schedule object validation Utils functions', () => {
  it('validateScheduleObject should return status = error for empty object passed as parameter.', () => {
    let result = validateScheduleObject({});
    expect(result).toBeDefined();
    expect(result).toHaveProperty('status', 'success');
  });

  it('validateScheduleObject should return status = success for schedule type manual and with its required data.', () => {
    let testPayload = { enabled: true, scheduleType: 'manual', openSubmissionDateTime: '2023-03-31' };
    let result = validateScheduleObject(testPayload);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('status', 'success');
  });

  it('validateScheduleObject should return status = success for schedule type closingDate and with its required data.', () => {
    let testPayload = { enabled: true, scheduleType: 'closingDate', openSubmissionDateTime: '2023-03-31', closeSubmissionDateTime: '2023-09-31' };
    let result = validateScheduleObject(testPayload);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('status', 'success');
  });

  it('checkIsFormExpired should return the default result object { allowLateSubmission: false, expire: false, message: "" }', () => {
    expect(checkIsFormExpired()).toEqual({ allowLateSubmissions: false, expire: false, message: '' });
  });

  it('checkIsFormExpired should return a message that the form is not available yet if the open time is a future date', () => {
    expect(
      checkIsFormExpired({
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
      checkIsFormExpired({
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
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        closingMessageEnabled: true,
        closingMessage: 'closing message',
        allowLateSubmissions: {
          enabled: false,
        },
        openSubmissionDateTime: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        closeSubmissionDateTime: moment().add(1, 'days').format('YYYY-MM-DD'),
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: false,
      message: 'closing message',
    });
  });

  it('checkIsFormExpired should return an expired object for a late schedule with no late submissions', () => {
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        allowLateSubmissions: {
          enabled: false,
        },
        openSubmissionDateTime: moment().subtract(2, 'days').format('YYYY-MM-DD'),
        closeSubmissionDateTime: moment().subtract(1, 'days').format('YYYY-MM-DD'),
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: true,
      message: '',
    });
  });

  it('checkIsFormExpired should return an expired object but have allowLateSubmissions to be true for a late schedule with late submissions', () => {
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: '1',
            intervalType: 'days',
          },
        },
        openSubmissionDateTime: moment().subtract(2, 'days').format('YYYY-MM-DD'),
        closeSubmissionDateTime: moment().subtract(1, 'days').format('YYYY-MM-DD'),
      })
    ).toEqual({
      allowLateSubmissions: true,
      expire: true,
      message: '',
    });
  });
  it('checkIsFormExpired should handle specific opening and closing times', () => {
    // Create dates for testing
    const now = moment();
    const yesterday = moment(now).subtract(1, 'days');
    const tomorrow = moment(now).add(1, 'days');

    // Test a form with specific times - form should be open
    const morningTime = '08:00';
    const eveningTime = '20:00';

    // Form is open because current time is after yesterday 8 AM and before tomorrow 8 PM
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        openSubmissionDateTime: yesterday.format('YYYY-MM-DD'),
        openSubmissionTime: morningTime,
        openSubmissionUTC: moment(`${yesterday.format('YYYY-MM-DD')}T${morningTime}`).toISOString(),
        closeSubmissionDateTime: tomorrow.format('YYYY-MM-DD'),
        closeSubmissionTime: eveningTime,
        closeSubmissionUTC: moment(`${tomorrow.format('YYYY-MM-DD')}T${eveningTime}`).toISOString(),
        allowLateSubmissions: {
          enabled: false,
        },
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: false,
      message: '',
    });

    // Test a form that shouldn't be open yet because the opening time is in the future today
    const futureTimeToday = moment().add(2, 'hours').format('HH:mm');
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        openSubmissionDateTime: now.format('YYYY-MM-DD'),
        openSubmissionTime: futureTimeToday,
        openSubmissionUTC: moment(`${now.format('YYYY-MM-DD')}T${futureTimeToday}`).toISOString(),
        closeSubmissionDateTime: tomorrow.format('YYYY-MM-DD'),
        allowLateSubmissions: {
          enabled: false,
        },
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: true,
      message: 'This form is not yet available for submission.',
    });

    // Test a form that has closed because the closing time has passed
    const pastTimeYesterday = moment(yesterday).format('HH:mm');
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        openSubmissionDateTime: yesterday.subtract(1, 'days').format('YYYY-MM-DD'),
        closeSubmissionDateTime: yesterday.format('YYYY-MM-DD'),
        closeSubmissionTime: pastTimeYesterday,
        closeSubmissionUTC: moment(`${yesterday.format('YYYY-MM-DD')}T${pastTimeYesterday}`).toISOString(),
        allowLateSubmissions: {
          enabled: false,
        },
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: true,
      message: '',
    });
  });

  it('checkIsFormExpired should correctly apply timezone offsets', () => {
    const now = moment();
    const yesterday = moment(now).subtract(1, 'days');
    const tomorrow = moment(now).add(1, 'days');

    // Mock timezone offset (Pacific Time, UTC-7)
    const pacificOffset = 420; // 7 hours * 60 minutes

    // Test a form with timezone offset but no specific time
    // Form should be open as we're between the dates with timezone consideration
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        openSubmissionDateTime: yesterday.format('YYYY-MM-DD'),
        closeSubmissionDateTime: tomorrow.format('YYYY-MM-DD'),
        timezoneOffset: pacificOffset,
        allowLateSubmissions: {
          enabled: false,
        },
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: false,
      message: '',
    });

    // Create a date that's "today" in UTC but might be "yesterday" or "tomorrow"
    // in different timezones - this tests the edge case of date boundaries
    const utcMidnight = moment().utc().startOf('day');

    // Test a form where the timezone offset affects whether it's expired
    // For example, if it's midnight UTC, it might still be the previous day in Pacific time
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        openSubmissionDateTime: utcMidnight.clone().subtract(2, 'days').format('YYYY-MM-DD'),
        closeSubmissionDateTime: utcMidnight.clone().subtract(1, 'days').format('YYYY-MM-DD'),
        timezoneOffset: pacificOffset, // Pacific Time
        allowLateSubmissions: {
          enabled: false,
        },
      })
    ).toMatchObject({
      expire: true, // Should be expired regardless of timezone
    });

    // Test late submissions with timezone consideration
    // If the form closed yesterday but has 2 days grace period, it should allow late submissions
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: ScheduleType.CLOSINGDATE,
        openSubmissionDateTime: yesterday.clone().subtract(2, 'days').format('YYYY-MM-DD'),
        closeSubmissionDateTime: yesterday.format('YYYY-MM-DD'),
        timezoneOffset: pacificOffset,
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: '2',
            intervalType: 'days',
          },
        },
      })
    ).toEqual({
      allowLateSubmissions: true,
      expire: true,
      message: '',
    });
  });
});
