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

/** "just now", "5m ago", "3h ago", "2d ago" for the done pile. */
export function relativeTime(from: Date, now = new Date()): string {
  const seconds = Math.max(0, (now.getTime() - from.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** "12 Jun 09:00" for reminder chips. */
export function formatDateTime(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${months[date.getMonth()] ?? ''} ${hh}:${mm}`;
}
