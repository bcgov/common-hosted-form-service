import moment from 'moment';
import { describe, expect, it } from 'vitest';

import { IdentityMode, ScheduleType } from '~/utils/constants';
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
  it('without late submissions or a repeat period, it should only stay open for the keep open period', () => {
    expect(
      transformUtils.getSubmissionPeriodDates(
        5,
        'days',
        moment.utc('2024-05-08'), // Use UTC
        0,
        'months',
        0,
        'years',
        moment.utc() // Use UTC
      )
    ).toEqual([
      {
        startDate: moment.utc('2024-05-08').format('YYYY-MM-DD HH:mm:ss'),
        closeDate: moment
          .utc('2024-05-08')
          .add(5, 'days')
          .format('YYYY-MM-DD HH:mm:ss'),
        graceDate: null,
      },
    ]);
  });

  it('with late submissions and no repeat period, it should only stay open for the keep open period and late submissions', () => {
    expect(
      transformUtils.getSubmissionPeriodDates(
        5,
        'days',
        moment.utc('2024-05-08'), // Use UTC
        0,
        'years',
        1,
        'months',
        moment.utc() // Use UTC
      )
    ).toEqual([
      {
        startDate: moment('2024-05-08').format('YYYY-MM-DD HH:mm:ss'),
        closeDate: moment('2024-05-08')
          .add(5, 'days')
          .format('YYYY-MM-DD HH:mm:ss'),
        graceDate: moment('2024-05-08')
          .add(5, 'days')
          .add(1, 'months')
          .format('YYYY-MM-DD HH:mm:ss'),
      },
    ]);
  });

  it('with late submissions and repeat period, it should stay open for 1 week then a month later it will add another keep open period of 1 week then add the late period', () => {
    expect(
      transformUtils.getSubmissionPeriodDates(
        5,
        'days',
        moment.utc('2024-05-08'),
        1,
        'months',
        1,
        'months',
        moment.utc('2024-07-15')
      )
    ).toEqual([
      {
        startDate: '2024-05-08 00:00:00',
        closeDate: '2024-05-13 00:00:00',
        graceDate: '2024-06-13 00:00:00',
      },
      {
        startDate: '2024-06-08 00:00:00',
        closeDate: '2024-06-13 00:00:00',
        graceDate: '2024-07-13 00:00:00',
      },
      {
        startDate: '2024-07-08 00:00:00',
        closeDate: '2024-07-13 00:00:00',
        graceDate: '2024-08-13 00:00:00',
      },
    ]);
  });

  it('without late submissions and with a repeat period, it should stay open for 1 week then a month later it will add another keep open period of 1 week', () => {
    expect(
      transformUtils.getSubmissionPeriodDates(
        5,
        'days',
        moment.utc('2024-05-08'), // Use UTC
        1,
        'months',
        0,
        'months',
        moment.utc('2024-07-15') // Use UTC
      )
    ).toEqual([
      {
        startDate: moment('2024-05-08').format('YYYY-MM-DD HH:mm:ss'),
        closeDate: moment('2024-05-08')
          .add(5, 'days')
          .format('YYYY-MM-DD HH:mm:ss'),
        graceDate: null,
      },
      {
        startDate: moment
          .utc('2024-05-08')
          .add(1, 'months')
          .format('YYYY-MM-DD HH:mm:ss'),
        closeDate: moment('2024-05-08')
          .add(5, 'days')
          .add(1, 'months')
          .format('YYYY-MM-DD HH:mm:ss'),
        graceDate: null,
      },
      {
        startDate: moment
          .utc('2024-05-08')
          .add(1, 'months')
          .add(1, 'months')
          .format('YYYY-MM-DD HH:mm:ss'),
        closeDate: moment('2024-05-08')
          .add(5, 'days')
          .add(1, 'months')
          .add(1, 'months')
          .format('YYYY-MM-DD HH:mm:ss'),
        graceDate: null,
      },
    ]);
  });
});
