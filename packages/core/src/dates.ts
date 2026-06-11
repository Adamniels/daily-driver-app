/**
 * Calendar date utilities on 'YYYY-MM-DD' strings.
 *
 * The only place in core that touches the Date object, and it only uses UTC
 * arithmetic on calendar days. Nothing here (or anywhere in core) reads the
 * wall clock; "today" is always an argument supplied by the caller.
 */
import type { DateString, Weekday } from './types.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const WEEKDAYS: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** True when the string is a real calendar date (rejects 2026-02-30 etc.). */
export function isDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function toUtcMs(date: DateString): number {
  if (!isDateString(date)) {
    throw new RangeError(`Invalid DateString: '${date}'`);
  }
  return Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
  );
}

function fromUtcMs(ms: number): DateString {
  const dt = new Date(ms);
  const y = String(dt.getUTCFullYear()).padStart(4, '0');
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The calendar day `n` days after `date` (negative n goes back). */
export function addDays(date: DateString, n: number): DateString {
  return fromUtcMs(toUtcMs(date) + n * DAY_MS);
}

/** Whole days from `from` to `to`; positive when `to` is later. */
export function diffDays(from: DateString, to: DateString): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

export function dayOfWeek(date: DateString): Weekday {
  const weekday = WEEKDAYS[new Date(toUtcMs(date)).getUTCDay()];
  if (weekday === undefined) throw new RangeError(`Invalid DateString: '${date}'`);
  return weekday;
}

/** The Monday of the ISO week containing `date`. */
export function mondayOfWeek(date: DateString): DateString {
  const dowFromMonday = (new Date(toUtcMs(date)).getUTCDay() + 6) % 7;
  return addDays(date, -dowFromMonday);
}

/**
 * ISO 8601 week key, e.g. '2026-W24'. The ISO year can differ from the
 * calendar year near January 1st (2021-01-01 belongs to 2020-W53).
 */
export function isoWeekKey(date: DateString): string {
  // Nearest-Thursday algorithm: a date's ISO week/year is that of its week's Thursday.
  const target = new Date(toUtcMs(date));
  const dowFromMonday = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dowFromMonday + 3);

  const isoYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const ftDow = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ftDow + 3);

  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** The last `n` calendar days ending at `date` inclusive, oldest first. */
export function lastNDays(date: DateString, n: number): DateString[] {
  if (n < 1 || !Number.isInteger(n)) throw new RangeError(`n must be a positive integer, got ${n}`);
  const result: DateString[] = [];
  for (let i = n - 1; i >= 0; i--) {
    result.push(addDays(date, -i));
  }
  return result;
}

/** Every calendar day from `from` to `to` inclusive, oldest first. */
export function datesInRange(from: DateString, to: DateString): DateString[] {
  const span = diffDays(from, to);
  if (span < 0) throw new RangeError(`'${from}' is after '${to}'`);
  const result: DateString[] = [];
  for (let i = 0; i <= span; i++) {
    result.push(addDays(from, i));
  }
  return result;
}
