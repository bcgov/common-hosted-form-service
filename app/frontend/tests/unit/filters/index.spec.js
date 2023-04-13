import moment from 'moment';
import * as filters from '@/filters';

describe('formatDate', () => {
  const now = new Date();

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns undefined when value is falsy', () => {
    const result = filters.formatDate(undefined);
    expect(result).toBeFalsy();
  });

  it('returns a properly formatted date string when value is a date', () => {
    const result = filters.formatDate(now);

    expect(result).toBeTruthy();
    expect(result).toMatch(moment(String(now)).format('MMMM D YYYY'));
  });
});

describe('formatDateLong', () => {
  const now = new Date();

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns undefined when value is falsy', () => {
    const result = filters.formatDateLong(undefined);
    expect(result).toBeFalsy();
  });

  it('returns a properly formatted date string when value is a date', () => {
    const result = filters.formatDateLong(now);

    expect(result).toBeTruthy();
    expect(result).toMatch(
      moment(String(now)).format('MMMM D YYYY, h:mm:ss a')
    );
  });
});
