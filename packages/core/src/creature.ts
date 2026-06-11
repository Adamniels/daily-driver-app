/**
 * Creature rules.
 *
 * Evolution is permanent and driven by level (the ledger only grows, so the
 * creature never devolves). Mood is a daily read of the last 7 days'
 * consistency — it dips fast when you lapse and recovers as soon as you do.
 * There is no permadeath: guilt is a bad long term motivator.
 */
import { isoWeekKey, lastNDays } from './dates.js';
import { isActiveOn, isScheduledOn } from './schedule.js';
import type { Completion, CreatureState, DateString, Habit, Mood, Stage } from './types.js';

/** Stage thresholds: the level at which each form is reached. */
export const STAGE_LEVELS: readonly { stage: Stage; minLevel: number }[] = [
  { stage: 'egg', minLevel: 1 },
  { stage: 'hatchling', minLevel: 3 },
  { stage: 'sprout', minLevel: 7 },
  { stage: 'juvenile', minLevel: 12 },
  { stage: 'adult', minLevel: 20 },
  { stage: 'mythic', minLevel: 30 },
];

export function stageForLevel(level: number): Stage {
  let current: Stage = 'egg';
  for (const { stage, minLevel } of STAGE_LEVELS) {
    if (level >= minLevel) current = stage;
  }
  return current;
}

/**
 * Completion rate over the trailing window (default 7 days, ending `today`).
 *
 * Daily habits: each active scheduled day in the window is one slot.
 * Weekly habits: each ISO week overlapping the window contributes
 * target × (active window days in that week / 7) slots and
 * min(completions in that whole week, target) × the same fraction done —
 * i.e. weekly habits are prorated by how much of their week is visible.
 *
 * Returns null when the window contains no slots at all (brand new account),
 * which callers treat as "no track record yet", not as failure.
 */
export function completionRate(
  habits: readonly Habit[],
  completions: readonly Completion[],
  today: DateString,
  days = 7,
): number | null {
  const window = lastNDays(today, days);

  let slots = 0;
  let done = 0;

  const completedSet = new Set<string>();
  const weekCounts = new Map<string, Map<string, number>>(); // habitId -> weekKey -> count
  for (const c of completions) {
    completedSet.add(`${c.habitId}|${c.date}`);
    const weekKey = isoWeekKey(c.date);
    let byWeek = weekCounts.get(c.habitId);
    if (!byWeek) {
      byWeek = new Map<string, number>();
      weekCounts.set(c.habitId, byWeek);
    }
    byWeek.set(weekKey, (byWeek.get(weekKey) ?? 0) + 1);
  }

  for (const habit of habits) {
    if (habit.type === 'daily') {
      for (const day of window) {
        if (!isActiveOn(habit, day) || !isScheduledOn(habit, day)) continue;
        slots += 1;
        if (completedSet.has(`${habit.id}|${day}`)) done += 1;
      }
    } else {
      const target = habit.targetPerWeek ?? 1;
      const activeDaysPerWeek = new Map<string, number>();
      for (const day of window) {
        if (!isActiveOn(habit, day)) continue;
        const weekKey = isoWeekKey(day);
        activeDaysPerWeek.set(weekKey, (activeDaysPerWeek.get(weekKey) ?? 0) + 1);
      }
      for (const [weekKey, activeDays] of activeDaysPerWeek) {
        const fraction = activeDays / 7;
        const countInWeek = weekCounts.get(habit.id)?.get(weekKey) ?? 0;
        slots += target * fraction;
        done += Math.min(countInWeek, target) * fraction;
      }
    }
  }

  if (slots === 0) return null;
  return Math.min(1, done / slots);
}

/**
 * thriving ≥ 0.8, happy ≥ 0.6, okay ≥ 0.4, sad ≥ 0.2, sleeping below.
 * No track record yet (null) reads as 'happy': a fresh creature is content.
 */
export function moodFromRate(rate: number | null): Mood {
  if (rate === null) return 'happy';
  if (rate >= 0.8) return 'thriving';
  if (rate >= 0.6) return 'happy';
  if (rate >= 0.4) return 'okay';
  if (rate >= 0.2) return 'sad';
  return 'sleeping';
}

/** Single entry point the UI consumes. */
export function creatureState(
  level: number,
  habits: readonly Habit[],
  completions: readonly Completion[],
  today: DateString,
): CreatureState {
  return {
    stage: stageForLevel(level),
    mood: moodFromRate(completionRate(habits, completions, today)),
    level,
  };
}
