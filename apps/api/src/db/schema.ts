/**
 * Database schema. The DB stores facts; meaning (levels, streaks, moods) is
 * always derived in @habit/core.
 *
 * Date convention: domain-relevant calendar days (completion date, habit
 * created/archived day) are `date` columns holding the *user local* day,
 * because all gamification rules operate on user local days. `timestamptz`
 * columns are audit metadata only.
 */
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const habitTypeEnum = pgEnum('habit_type', ['daily', 'weekly']);
export const xpSourceEnum = pgEnum('xp_source', ['habit', 'task', 'perfect_day']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  timezone: text('timezone').notNull().default('Europe/Stockholm'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const habits = pgTable(
  'habits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    emoji: text('emoji').notNull().default('✨'),
    color: text('color').notNull().default('violet'),
    type: habitTypeEnum('type').notNull(),
    /** Daily habits: chosen weekdays; null = every day. */
    scheduledDays: text('scheduled_days').array(),
    /** Weekly habits: required completions per ISO week. */
    targetPerWeek: integer('target_per_week'),
    baseXp: integer('base_xp').notNull().default(10),
    sortOrder: integer('sort_order').notNull().default(0),
    /** User local day the habit started existing; streaks never look earlier. */
    createdOn: date('created_on').notNull(),
    /** User local day the habit was archived; null = active. */
    archivedOn: date('archived_on'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('habits_user_idx').on(t.userId, t.archivedOn)],
);

export const habitCompletions = pgTable(
  'habit_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** User local calendar day this completion belongs to. */
    date: date('date').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('completions_habit_date_unique').on(t.habitId, t.date),
    index('completions_user_date_idx').on(t.userId, t.date),
  ],
);

/** Append only XP ledger — the source of truth for total XP and level. */
export const xpEvents = pgTable(
  'xp_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    source: xpSourceEnum('source').notNull(),
    /** Completion id or task id; null for perfect_day bonuses. */
    sourceId: uuid('source_id'),
    /** User local day the XP was earned on. */
    date: date('date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('xp_events_user_date_idx').on(t.userId, t.date)],
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    notes: text('notes'),
    remindAt: timestamp('remind_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tasks_user_completed_idx').on(t.userId, t.completedAt)],
);

export const creatures = pgTable('creatures', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('Blob'),
  hatchedAt: timestamp('hatched_at', { withTimezone: true }).notNull().defaultNow(),
});
