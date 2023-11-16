import moment from 'moment';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as filters from '~/filters';

describe('formatDate', () => {
  const now = new Date();

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns undefined when value is falsy', () => {
    const result = filters.formatDateLong(undefined);
    expect(result).toBeFalsy();
  });

  it('returns a properly formatted date string when value is a date', () => {
    const result = filters.formatDateLong(now);

    expect(result).toBeTruthy();
    expect(result).toMatch(moment(String(now)).format('YYYY-MM-DD hh:mm:ss a'));
  });

  it('returns a properly formatted date string in the am', () => {
    const date = new Date(2023, 3, 5, 6, 7, 8); // months are origin 0
    const result = filters.formatDateLong(date);

    expect(result).toBeTruthy();
    expect(result).toMatch('2023-04-05 06:07:08 a');
  });

  it('returns a properly formatted date string in the pm', () => {
    const date = new Date(2023, 3, 5, 18, 7, 8); // months are origin 0
    const result = filters.formatDateLong(date);

    expect(result).toBeTruthy();
    expect(result).toMatch('2023-04-05 06:07:08 p');
  });

  it('returns a properly formatted date with no leading zeroes', () => {
    const date = new Date(2023, 9, 10, 10, 10, 10); // months are origin 0
    const result = filters.formatDateLong(date);

    expect(result).toBeTruthy();
    expect(result).toMatch('2023-10-10 10:10:10 a');
  });
});
