/**
 * Domain types for the gamification engine.
 *
 * Core only needs the fields rules depend on. Presentation fields (name,
 * emoji, color) live in the API/DB layer; rows there structurally satisfy
 * these interfaces.
 */

/** A calendar day in the user's timezone, formatted 'YYYY-MM-DD'. */
export type DateString = string;

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type HabitType = 'daily' | 'weekly';

export interface Habit {
  id: string;
  type: HabitType;
  /** Daily habits only. null = scheduled every day. Never an empty array. */
  scheduledDays: readonly Weekday[] | null;
  /** Weekly habits only: required completions per ISO week (1–7). */
  targetPerWeek: number | null;
  baseXp: number;
  /** Day the habit was created; streak walks never look before this. */
  createdAt: DateString;
  archivedAt: DateString | null;
}

export interface Completion {
  habitId: string;
  date: DateString;
}

export type XpSource = 'habit' | 'task' | 'perfect_day';

export interface XpEvent {
  amount: number;
  source: XpSource;
  date: DateString;
}

export type Stage = 'egg' | 'hatchling' | 'sprout' | 'juvenile' | 'adult' | 'mythic';

export type Mood = 'thriving' | 'happy' | 'okay' | 'sad' | 'sleeping';

export interface CreatureState {
  stage: Stage;
  mood: Mood;
  level: number;
}
