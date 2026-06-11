/**
 * When does a habit "count" for a given day? Shared by streaks, perfect day,
 * completion rate and heatmap so the answer never drifts between features.
 */
import { dayOfWeek } from './dates.js';
import type { DateString, Habit } from './types.js';

/** Habit existed and was not archived on `date`. */
export function isActiveOn(
  habit: Pick<Habit, 'createdAt' | 'archivedAt'>,
  date: DateString,
): boolean {
  if (habit.createdAt > date) return false;
  return habit.archivedAt === null || habit.archivedAt > date;
}

/**
 * Daily habits are scheduled on their chosen weekdays (null = every day).
 * Weekly habits are never "scheduled on a day": they owe a count per week,
 * not an appearance on a date.
 */
export function isScheduledOn(
  habit: Pick<Habit, 'type' | 'scheduledDays'>,
  date: DateString,
): boolean {
  if (habit.type !== 'daily') return false;
  return habit.scheduledDays === null || habit.scheduledDays.includes(dayOfWeek(date));
}
