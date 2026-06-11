import type { DateString } from '@habit/core';

/**
 * The user's current calendar day. The single place the API turns the wall
 * clock into a DateString; everything below this call is pure core logic.
 * 'en-CA' formats as YYYY-MM-DD.
 */
export function todayInTimeZone(timezone: string): DateString {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
