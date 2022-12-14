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
    expect(transformUtils.generateIdps({
      idps: ['foo', 'bar'],
      userType: IdentityMode.LOGIN
    })).toEqual([
      { code: 'foo' },
      { code: 'bar' }
    ]);
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
    expect(transformUtils.parseIdps([
      { code: 'foo' },
      { code: 'bar' }
    ])).toEqual({
      idps: ['foo', 'bar'],
      userType: IdentityMode.LOGIN,
    });
  });
});

const sampleScheduleData = () => ({ 
  'enabled': true, 
  'scheduleType': 'period', 
  'closingMessage': 'Custom Message Goes here', 
  'keepOpenForTerm': '1', 
  'repeatSubmission': { 
    'enabled': true, 
    'everyTerm': '1',
    'repeatUntil': 
     '2023-02-03',
    'keepAliveFor': null, 
    'onSpecificDay': null, 
    'everyIntervalType': 'months' 
  }, 
  'keepOpenForInterval': 'days', 
  'allowLateSubmissions': { 
    'enabled': true, 
    'forNext': {
      'term': '4',
      'intervalType': 'days' 
    } 
  }, 
  'closingMessageEnabled': true, 
  'openSubmissionDateTime': '2022-11-01', 
  'closeSubmissionDateTime': null
});

describe('isFormExpired', () => {
  it('Returns an object when supply an empty object', () => {
    expect(transformUtils.isFormExpired({})).toEqual(
      {
        allowLateSubmissions: false,
        expire: false,
        message: ''
      });
  });

  it('Returns an object when supply a formSchedule object', () => {
    expect(transformUtils.isFormExpired(sampleScheduleData())).toEqual(
      {
        allowLateSubmissions: false,
        expire: true,
        message: 'Custom Message Goes here'
      });
  });
});

//No more usage on frontend, Will be deleted in future commits
// describe('isEligibleLateSubmission', () => {
//   it('Returns True when supply Valid date(Moment OBJ),term(Int),interval(Str) as parameters.', () => {
//     expect(transformUtils.isEligibleLateSubmission(moment(),2,'days')).toBeFalsy();
//   });

//   it('Returns False when supply Invalid date(Moment OBJ),term(Int),interval(Str) as parameters.', () => {
//     expect(transformUtils.isEligibleLateSubmission(moment().add(3,'days'),2,'days')).toBeFalsy();
//   });

//   it('Returns False when supply Invalid date(Moment OBJ),term(Int),interval(Str) as parameters.', () => {
//     expect(transformUtils.isEligibleLateSubmission(moment().subtract(3,'days'),2,'days')).toBeFalsy();
//   });
// });


describe('calculateCloseDate', () => {
  it('Returns Moment Object when supply Valid date(Moment OBJ),term(Int),interval(Str) as parameters.', () => {
    expect(transformUtils.calculateCloseDate(moment(),2,'days')).toEqual(expect.any(String));
  });
});

describe('getCalculatedCloseSubmissionDate', () => {
  it('Returns Moment Object when supply Valid data as parameters.', () => {
    expect(transformUtils.getCalculatedCloseSubmissionDate(moment('2022-11-01'),1,'days',4,'days',1,'months',moment('2023-02-03'))).toBeTruthy();
  });
});
