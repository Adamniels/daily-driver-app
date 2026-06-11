import type { Completion, Habit, Weekday } from '@habit/core';
import type { habitCompletions, habits } from '../db/schema.js';

type HabitRow = typeof habits.$inferSelect;
type CompletionRow = typeof habitCompletions.$inferSelect;

/** DB row → core domain habit. The only place this mapping exists. */
export function toCoreHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    type: row.type,
    scheduledDays: (row.scheduledDays as Weekday[] | null) ?? null,
    targetPerWeek: row.targetPerWeek,
    baseXp: row.baseXp,
    createdAt: row.createdOn,
    archivedAt: row.archivedOn,
  };
}

export function toCoreCompletion(row: CompletionRow): Completion {
  return { habitId: row.habitId, date: row.date };
}
