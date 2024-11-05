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

  it('validateScheduleObject should return status = success for schedule type period and with its required data.', () => {
    let testPayload = {
      enabled: true,
      scheduleType: 'period',
      openSubmissionDateTime: '2023-03-31',
      keepOpenForInterval: 'days',
      keepOpenForTerm: '4',
      repeatSubmission: { everyTerm: '15', repeatUntil: '2024-04-01', everyIntervalType: 'days' },
    };
    let result = validateScheduleObject(testPayload);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('status', 'success');
  });

  it('checkIsFormExpired should return the default result object { allowLateSubmission: false, expire: false, message: "" }', () => {
    expect(checkIsFormExpired()).toEqual({ allowLateSubmissions: false, expire: false, message: '' });
  });

  it('checkIsFormExpired should return a message that the form is not available yet if the open time is a future date { ...result, expire: true, allowLateSubmissions: false, message: "This form is not yet available for submission."', () => {
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

  it('checkIsFormExpired should return a valid object for a manual schedule with a valid schedule ', () => {
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
        repeatSubmission: {
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
        repeatSubmission: {
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
        repeatSubmission: {
          enabled: false,
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

  it('checkIsFormExpired for a period of 1 days should return an unexpired object in a valid schedule', () => {
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: 'period',
        keepOpenForTerm: '1',
        repeatSubmission: {
          enabled: true,
          everyTerm: '1',
          repeatUntil: moment().add(1, 'month').format('YYYY-MM-DD'),
          everyIntervalType: 'weeks',
        },
        keepOpenForInterval: 'days',
        allowLateSubmissions: { enabled: true, forNext: { term: '1', intervalType: 'days' } },
        closingMessageEnabled: false,
        openSubmissionDateTime: moment().format('YYYY-MM-DD'),
        closeSubmissionDateTime: null,
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: false,
      message: '',
    });
  });

  it('checkIsFormExpired for a period on an expired day with late submissions should allow it', () => {
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: 'period',
        keepOpenForTerm: '1',
        repeatSubmission: {
          enabled: true,
          everyTerm: '1',
          repeatUntil: moment().add(1, 'month').format('YYYY-MM-DD'),
          everyIntervalType: 'weeks',
        },
        keepOpenForInterval: 'days',
        allowLateSubmissions: { enabled: true, forNext: { term: '1', intervalType: 'days' } },
        closingMessageEnabled: false,
        openSubmissionDateTime: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        closeSubmissionDateTime: null,
      })
    ).toEqual({
      allowLateSubmissions: true,
      expire: true,
      message: '',
    });
  });

  it('checkIsFormExpired for a period on an expired day with no late submissions should disallow it', () => {
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: 'period',
        keepOpenForTerm: '1',
        repeatSubmission: {
          enabled: true,
          everyTerm: '1',
          repeatUntil: moment().add(1, 'month').format('YYYY-MM-DD'),
          everyIntervalType: 'weeks',
        },
        keepOpenForInterval: 'days',
        allowLateSubmissions: { enabled: false, forNext: { term: '1', intervalType: 'days' } },
        closingMessageEnabled: false,
        openSubmissionDateTime: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        closeSubmissionDateTime: null,
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: true,
      message: '',
    });
  });

  it('checkIsFormExpired for a period of 1 days should return an expired object in an invalid schedule', () => {
    expect(
      checkIsFormExpired({
        enabled: true,
        scheduleType: 'period',
        keepOpenForTerm: '1',
        repeatSubmission: {
          enabled: false,
          everyTerm: null,
          repeatUntil: null,
          everyIntervalType: null,
        },
        keepOpenForInterval: 'days',
        allowLateSubmissions: { enabled: false, forNext: { term: '1', intervalType: 'days' } },
        closingMessageEnabled: false,
        openSubmissionDateTime: moment().subtract(5, 'days').format('YYYY-MM-DD'),
        closeSubmissionDateTime: null,
      })
    ).toEqual({
      allowLateSubmissions: false,
      expire: true,
      message: '',
    });
  });
});
