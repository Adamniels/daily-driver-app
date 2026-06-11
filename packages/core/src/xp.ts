/**
 * XP rules. Amounts are computed at completion time and written to the
 * append only xp_events ledger by the API; totals and levels are always
 * derived from the ledger, never stored.
 */
import { isActiveOn, isScheduledOn } from './schedule.js';
import type { Completion, DateString, Habit } from './types.js';

/** Completing a backlog task. Deliberately small: tasks reward tidying, not grinding. */
export const TASK_XP = 5;

/** Finishing every habit scheduled on a given day. */
export const PERFECT_DAY_BONUS = 20;

export const STREAK_MULTIPLIER_STEP = 0.05;
export const STREAK_MULTIPLIER_CAP = 10;

/**
 * 1 + 0.05 × min(streak, 10): ramps to 1.5× at a 10 day streak and caps
 * there. `streak` is the chain already banked *before* the new completion,
 * so the first completion of a fresh habit earns exactly baseXp.
 */
export function streakMultiplier(streak: number): number {
  return 1 + STREAK_MULTIPLIER_STEP * Math.min(Math.max(streak, 0), STREAK_MULTIPLIER_CAP);
}

/** XP for completing a habit, given the streak banked before this completion. */
export function completionXp(habit: Pick<Habit, 'baseXp'>, streakBefore: number): number {
  return Math.round(habit.baseXp * streakMultiplier(streakBefore));
}

/**
 * A perfect day = at least one daily habit was scheduled on `date` and every
 * scheduled one was completed. Weekly habits don't participate: they owe a
 * weekly count, not a daily appearance. A day with nothing scheduled is not
 * perfect, it is empty.
 */
export function isPerfectDay(
  habits: readonly Habit[],
  completions: readonly Completion[],
  date: DateString,
): boolean {
  const scheduled = habits.filter((h) => isActiveOn(h, date) && isScheduledOn(h, date));
  if (scheduled.length === 0) return false;

  const doneIds = new Set<string>();
  for (const c of completions) {
    if (c.date === date) doneIds.add(c.habitId);
  }
  return scheduled.every((h) => doneIds.has(h.id));
}
