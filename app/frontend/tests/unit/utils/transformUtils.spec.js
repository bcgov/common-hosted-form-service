import { IdentityMode } from '@/utils/constants';
import moment from 'moment';
import * as transformUtils from '@/utils/transformUtils';

describe('generateIdps', () => {
  it('returns an empty array when empty object', () => {
    expect(transformUtils.generateIdps({})).toEqual([]);
  });

  it('returns an empty array when usertype is team', () => {
    expect(transformUtils.generateIdps({ userType: IdentityMode.TEAM })).toEqual([]);
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
    expect(transformUtils.generateIdps({ userType: IdentityMode.PUBLIC })).toEqual([{ code: IdentityMode.PUBLIC }]);
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
    expect(transformUtils.parseIdps([{ code: 'foo' }, { code: 'bar' }])).toEqual({
      idps: ['foo', 'bar'],
      userType: IdentityMode.LOGIN,
    });
  });
});

describe('calculateCloseDate', () => {
  it('Returns Moment Object when supply Valid date(Moment OBJ),term(Int),interval(Str) as parameters.', () => {
    expect(transformUtils.calculateCloseDate(moment(), 2, 'days')).toEqual(expect.any(String));
  });
});

describe('getCalculatedCloseSubmissionDate', () => {
  it('Returns Moment Object when supply Valid data as parameters.', () => {
    expect(transformUtils.getCalculatedCloseSubmissionDate(moment('2022-11-01'), 1, 'days', 4, 'days', 1, 'months', moment('2023-02-03'))).toBeTruthy();
  });
});
