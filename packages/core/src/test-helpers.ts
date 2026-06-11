/** Fixture builders for tests. Not exported from the package index. */
import type { Completion, Habit } from './types.js';

export function dailyHabit(overrides: Partial<Habit> & { id: string }): Habit {
  return {
    type: 'daily',
    scheduledDays: null,
    targetPerWeek: null,
    baseXp: 10,
    createdAt: '2026-01-01',
    archivedAt: null,
    ...overrides,
  };
}

export function weeklyHabit(overrides: Partial<Habit> & { id: string }): Habit {
  return {
    type: 'weekly',
    scheduledDays: null,
    targetPerWeek: 3,
    baseXp: 10,
    createdAt: '2026-01-01',
    archivedAt: null,
    ...overrides,
  };
}

export function done(habitId: string, dates: readonly string[]): Completion[] {
  return dates.map((date) => ({ habitId, date }));
}
