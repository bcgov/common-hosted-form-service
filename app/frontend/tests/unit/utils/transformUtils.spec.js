import moment from 'moment';
import { describe, expect, it } from 'vitest';

import { IdentityMode } from '~/utils/constants';
import * as transformUtils from '~/utils/transformUtils';

describe('generateIdps', () => {
  it('returns an empty array when empty object', () => {
    expect(transformUtils.generateIdps({})).toEqual([]);
  });

  it('returns an empty array when usertype is team', () => {
    expect(
      transformUtils.generateIdps({ userType: IdentityMode.TEAM })
    ).toEqual([]);
  });

  it('returns correct values when usertype is login', () => {
    expect(
      transformUtils.generateIdps({
        idps: ['foo', 'bar'],
        userType: IdentityMode.LOGIN,
      })
    ).toEqual([{ code: 'foo' }, { code: 'bar' }]);
  });

  it('returns correct values when usertype is public', () => {
    expect(
      transformUtils.generateIdps({ userType: IdentityMode.PUBLIC })
    ).toEqual([{ code: IdentityMode.PUBLIC }]);
  });
});

describe('parseIdps', () => {
  it('returns an empty array idps and usertype team when undefined', () => {
    expect(transformUtils.parseIdps(undefined)).toEqual({
      idps: [],
      userType: IdentityMode.TEAM,
    });
  });

  it('returns an empty array idps and usertype team when empty array', () => {
    expect(transformUtils.parseIdps([])).toEqual({
      idps: [],
      userType: IdentityMode.TEAM,
    });
  });

  it('returns an empty array idps and usertype public when public', () => {
    expect(transformUtils.parseIdps([{ code: IdentityMode.PUBLIC }])).toEqual({
      idps: [],
      userType: IdentityMode.PUBLIC,
    });
  });

  it('returns correct idps and usertype login when login', () => {
    expect(
      transformUtils.parseIdps([{ code: 'foo' }, { code: 'bar' }])
    ).toEqual({
      idps: ['foo', 'bar'],
      userType: IdentityMode.LOGIN,
    });
  });
});

describe('getSubmissionPeriodDates', () => {
  it('should return submission period dates with open and close dates', () => {
    const openDate = moment('2024-05-08');
    const closeDate = moment('2024-05-15');

    expect(
      transformUtils.getSubmissionPeriodDates(openDate, closeDate)
    ).toEqual([
      {
        startDate: moment('2024-05-08').format('YYYY-MM-DD HH:MM:SS'),
        closeDate: moment('2024-05-15').format('YYYY-MM-DD HH:MM:SS'),
        graceDate: null,
      },
    ]);
  });

  it('should include grace period if late submissions are enabled', () => {
    const openDate = moment('2024-05-08');
    const closeDate = moment('2024-05-15');
    const allowLateSubmissions = {
      enabled: true,
      forNext: {
        term: 3,
        intervalType: 'days',
      },
    };

    expect(
      transformUtils.getSubmissionPeriodDates(
        openDate,
        closeDate,
        allowLateSubmissions
      )
    ).toEqual([
      {
        startDate: moment('2024-05-08').format('YYYY-MM-DD HH:MM:SS'),
        closeDate: moment('2024-05-15').format('YYYY-MM-DD HH:MM:SS'),
        graceDate: moment('2024-05-15')
          .add(3, 'days')
          .format('YYYY-MM-DD HH:MM:SS'),
      },
    ]);
  });

  it('should not include grace period if late submissions are disabled', () => {
    const openDate = moment('2024-05-08');
    const closeDate = moment('2024-05-15');
    const allowLateSubmissions = {
      enabled: false,
      forNext: {
        term: 3,
        intervalType: 'days',
      },
    };

    expect(
      transformUtils.getSubmissionPeriodDates(
        openDate,
        closeDate,
        allowLateSubmissions
      )
    ).toEqual([
      {
        startDate: moment('2024-05-08').format('YYYY-MM-DD HH:MM:SS'),
        closeDate: moment('2024-05-15').format('YYYY-MM-DD HH:MM:SS'),
        graceDate: null,
      },
    ]);
  });
});
