/**
 * Streak rules.
 *
 * Daily habits count consecutive *scheduled* days: unscheduled days neither
 * break nor extend a streak. Today is graceful — if today is scheduled but
 * not yet completed, the streak earned through yesterday still stands; it
 * only breaks once the day is over.
 *
 * Weekly habits count consecutive ISO weeks meeting targetPerWeek, with the
 * same grace for the current week.
 */
import { addDays, diffDays, isoWeekKey, mondayOfWeek } from './dates.js';
import { isScheduledOn } from './schedule.js';
import type { Completion, DateString, Habit } from './types.js';

function completionDates(habit: Pick<Habit, 'id'>, completions: readonly Completion[]) {
  const dates = new Set<DateString>();
  for (const c of completions) {
    if (c.habitId === habit.id) dates.add(c.date);
  }
  return dates;
}

function weeklyCounts(habit: Pick<Habit, 'id'>, completions: readonly Completion[]) {
  const counts = new Map<string, number>();
  for (const c of completions) {
    if (c.habitId !== habit.id) continue;
    const key = isoWeekKey(c.date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Current streak for a daily habit as of `today`. */
export function dailyStreak(
  habit: Habit,
  completions: readonly Completion[],
  today: DateString,
): number {
  const done = completionDates(habit, completions);

  let day = today;
  // Grace: an incomplete today never breaks the chain, it just doesn't extend it yet.
  if (isScheduledOn(habit, day) && !done.has(day)) {
    day = addDays(day, -1);
  }

  let streak = 0;
  while (diffDays(habit.createdAt, day) >= 0) {
    if (isScheduledOn(habit, day)) {
      if (!done.has(day)) break;
      streak += 1;
    }
    day = addDays(day, -1);
  }
  return streak;
}

/** Current streak for a weekly habit as of `today`, in whole ISO weeks. */
export function weeklyStreak(
  habit: Habit,
  completions: readonly Completion[],
  today: DateString,
): number {
  const target = habit.targetPerWeek ?? 1;
  const counts = weeklyCounts(habit, completions);

  let streak = 0;
  // Current week counts when already met; an unmet current week is grace, not a break.
  if ((counts.get(isoWeekKey(today)) ?? 0) >= target) {
    streak += 1;
  }

  let monday = addDays(mondayOfWeek(today), -7);
  const firstMonday = mondayOfWeek(habit.createdAt);
  while (diffDays(firstMonday, monday) >= 0) {
    if ((counts.get(isoWeekKey(monday)) ?? 0) < target) break;
    streak += 1;
    monday = addDays(monday, -7);
  }
  return streak;
}

/** Current streak as of `today`, dispatching on habit type. */
export function streakForHabit(
  habit: Habit,
  completions: readonly Completion[],
  today: DateString,
): number {
  return habit.type === 'daily'
    ? dailyStreak(habit, completions, today)
    : weeklyStreak(habit, completions, today);
}

/**
 * The longest streak found anywhere in this habit's history. Scans between
 * the first and last completion only, so a live unbroken run ending today is
 * the caller's to consider: use max(bestStreak, current streak).
 */
export function bestStreak(habit: Habit, completions: readonly Completion[]): number {
  if (habit.type === 'daily') {
    const done = completionDates(habit, completions);
    if (done.size === 0) return 0;
    const sorted = [...done].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first === undefined || last === undefined) return 0;

    let best = 0;
    let run = 0;
    for (let day = first; diffDays(day, last) >= 0; day = addDays(day, 1)) {
      if (!isScheduledOn(habit, day)) continue;
      if (done.has(day)) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    return best;
  }

  const target = habit.targetPerWeek ?? 1;
  const counts = weeklyCounts(habit, completions);
  const dates = completions.filter((c) => c.habitId === habit.id).map((c) => c.date);
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first === undefined || last === undefined) return 0;

  let best = 0;
  let run = 0;
  const lastMonday = mondayOfWeek(last);
  for (
    let monday = mondayOfWeek(first);
    diffDays(monday, lastMonday) >= 0;
    monday = addDays(monday, 7)
  ) {
    if ((counts.get(isoWeekKey(monday)) ?? 0) >= target) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}
