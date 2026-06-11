/**
 * The app computes "today" in the device timezone and passes it to the API
 * (invariant 2). Calendar arithmetic itself comes from @habit/core.
 */
import type { DateString } from '@habit/core';

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Today as local 'YYYY-MM-DD' (en-CA locale formats exactly that way). */
export function todayLocal(): DateString {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
