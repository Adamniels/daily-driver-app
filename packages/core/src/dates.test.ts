import { describe, expect, it } from 'vitest';
import {
  addDays,
  datesInRange,
  dayOfWeek,
  diffDays,
  isDateString,
  isoWeekKey,
  lastNDays,
  mondayOfWeek,
} from './dates.js';

describe('isDateString', () => {
  it('accepts real dates', () => {
    expect(isDateString('2026-06-11')).toBe(true);
    expect(isDateString('2028-02-29')).toBe(true); // leap day
  });

  it('rejects impossible or malformed dates', () => {
    expect(isDateString('2026-02-30')).toBe(false);
    expect(isDateString('2026-02-29')).toBe(false); // 2026 is not a leap year
    expect(isDateString('2026-13-01')).toBe(false);
    expect(isDateString('2026-6-1')).toBe(false);
    expect(isDateString('not-a-date')).toBe(false);
  });
});

describe('addDays', () => {
  it('crosses month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('crosses year boundaries', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('handles leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('throws on invalid input', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError);
  });
});

describe('diffDays', () => {
  it('is positive when `to` is later', () => {
    expect(diffDays('2026-06-01', '2026-06-11')).toBe(10);
    expect(diffDays('2026-06-11', '2026-06-01')).toBe(-10);
    expect(diffDays('2026-06-11', '2026-06-11')).toBe(0);
  });
});

describe('dayOfWeek', () => {
  it('matches known weekdays', () => {
    expect(dayOfWeek('2026-06-11')).toBe('thu');
    expect(dayOfWeek('2026-06-08')).toBe('mon');
    expect(dayOfWeek('2026-06-14')).toBe('sun');
    expect(dayOfWeek('2028-02-29')).toBe('tue');
  });
});

describe('mondayOfWeek', () => {
  it('returns the Monday of the containing ISO week', () => {
    expect(mondayOfWeek('2026-06-11')).toBe('2026-06-08'); // Thursday
    expect(mondayOfWeek('2026-06-08')).toBe('2026-06-08'); // Monday is itself
    expect(mondayOfWeek('2026-06-14')).toBe('2026-06-08'); // Sunday closes the week
  });
});

describe('isoWeekKey', () => {
  it('handles plain mid-year weeks', () => {
    expect(isoWeekKey('2026-06-11')).toBe('2026-W24');
    expect(isoWeekKey('2026-06-14')).toBe('2026-W24'); // Sunday, same week
    expect(isoWeekKey('2026-06-15')).toBe('2026-W25'); // next Monday
  });

  it('assigns early January to the previous ISO year when applicable', () => {
    expect(isoWeekKey('2026-01-01')).toBe('2026-W01'); // Jan 1 2026 is a Thursday
    expect(isoWeekKey('2021-01-01')).toBe('2020-W53'); // classic edge case
  });

  it('assigns late December to the next ISO year when applicable', () => {
    expect(isoWeekKey('2024-12-30')).toBe('2025-W01'); // Monday of week 1, 2025
    expect(isoWeekKey('2025-12-29')).toBe('2026-W01');
  });
});

describe('lastNDays', () => {
  it('returns n days ending at the date, oldest first', () => {
    expect(lastNDays('2026-06-11', 3)).toEqual(['2026-06-09', '2026-06-10', '2026-06-11']);
    expect(lastNDays('2026-06-11', 1)).toEqual(['2026-06-11']);
  });

  it('rejects non positive n', () => {
    expect(() => lastNDays('2026-06-11', 0)).toThrow(RangeError);
  });
});

describe('datesInRange', () => {
  it('is inclusive on both ends', () => {
    expect(datesInRange('2026-06-10', '2026-06-12')).toEqual([
      '2026-06-10',
      '2026-06-11',
      '2026-06-12',
    ]);
    expect(datesInRange('2026-06-11', '2026-06-11')).toEqual(['2026-06-11']);
  });

  it('rejects reversed ranges', () => {
    expect(() => datesInRange('2026-06-12', '2026-06-11')).toThrow(RangeError);
  });
});
