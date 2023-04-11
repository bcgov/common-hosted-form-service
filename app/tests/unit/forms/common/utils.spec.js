const { queryUtils, typeUtils, validateScheduleObject } = require('../../../../src/forms/common/utils');

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
});
