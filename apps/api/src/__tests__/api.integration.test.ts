/**
 * Integration tests against a real Postgres (TEST_DATABASE_URL).
 * Procedures are exercised through appRouter.createCaller — same code path
 * as HTTP minus transport. The DB is truncated before every test.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { addDays, mondayOfWeek } from '@habit/core';
import { verifyToken } from '../auth/jwt.js';
import type { DbHandle } from '../db/client.js';
import { habitCompletions, habits as habitsTable, users, xpEvents } from '../db/schema.js';
import { todayInTimeZone } from '../lib/dates.js';
import type { Context, UserRow } from '../trpc/context.js';
import { appRouter } from '../trpc/router.js';
import { initTestDb, resetDb } from './setup.js';

let handle: DbHandle;
const CONFIG = { jwtSecret: 'integration-test-secret', allowMultiUser: true };

beforeAll(async () => {
  handle = await initTestDb();
});

afterAll(async () => {
  await handle.pool.end();
});

beforeEach(async () => {
  await resetDb(handle.db);
});

function caller(user: UserRow | null, config = CONFIG) {
  const ctx: Context = { db: handle.db, user, config };
  return appRouter.createCaller(ctx);
}

async function newUser(email: string) {
  const reg = await caller(null).auth.register({
    email,
    password: 'password123',
    displayName: 'Adam',
    creatureName: 'Pix',
    timezone: 'UTC',
  });
  const [row] = await handle.db.select().from(users).where(eq(users.id, reg.user.id)).limit(1);
  if (!row) throw new Error('user row missing');
  return { api: caller(row), user: row, token: reg.token };
}

const today = () => todayInTimeZone('UTC');

async function ledger(userId: string) {
  return handle.db.select().from(xpEvents).where(eq(xpEvents.userId, userId));
}

describe('auth', () => {
  it('register → login → me, with a valid token', async () => {
    const { user, token } = await newUser('adam@test.se');
    expect(await verifyToken(token, CONFIG.jwtSecret)).toBe(user.id);

    const login = await caller(null).auth.login({ email: 'ADAM@test.se', password: 'password123' });
    expect(login.user.id).toBe(user.id);

    const me = await caller(user).auth.me();
    expect(me).toEqual({ id: user.id, email: 'adam@test.se', displayName: 'Adam', timezone: 'UTC' });
  });

  it('rejects wrong passwords and unknown emails identically', async () => {
    await newUser('adam@test.se');
    await expect(
      caller(null).auth.login({ email: 'adam@test.se', password: 'wrong-password' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(
      caller(null).auth.login({ email: 'ghost@test.se', password: 'password123' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('locks registration after the first user unless ALLOW_MULTI_USER', async () => {
    const locked = { ...CONFIG, allowMultiUser: false };
    await caller(null, locked).auth.register({
      email: 'first@test.se',
      password: 'password123',
      displayName: 'First',
    });
    await expect(
      caller(null, locked).auth.register({
        email: 'second@test.se',
        password: 'password123',
        displayName: 'Second',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('rejects duplicate emails', async () => {
    await newUser('adam@test.se');
    await expect(
      caller(null).auth.register({
        email: 'adam@test.se',
        password: 'password123',
        displayName: 'Dup',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('creates the creature at registration (hatching)', async () => {
    const { api } = await newUser('adam@test.se');
    const creature = await api.creature.get();
    expect(creature.name).toBe('Pix');
    expect(creature.state).toEqual({ stage: 'egg', mood: 'happy', level: 1 });
  });
});

describe('completions.toggle — ledger integrity', () => {
  it('awards base XP + perfect day on completing the only habit, and fully reverses', async () => {
    const { api, user } = await newUser('adam@test.se');
    const habit = await api.habits.create({ type: 'daily', name: 'Meditate' });

    const on = await api.completions.toggle({ habitId: habit.id, date: today() });
    expect(on.completed).toBe(true);
    expect(on.xpDelta).toBe(30); // 10 base + 20 perfect day
    expect(on.totalXp).toBe(30);
    expect(on.perfectDay).toBe(true);
    expect(on.habitStreak).toBe(1);

    const events = await ledger(user.id);
    expect(events.map((e) => [e.source, e.amount]).sort()).toEqual([
      ['habit', 10],
      ['perfect_day', 20],
    ]);

    const off = await api.completions.toggle({ habitId: habit.id, date: today() });
    expect(off.completed).toBe(false);
    expect(off.xpDelta).toBe(-30);
    expect(off.totalXp).toBe(0);
    expect(await ledger(user.id)).toHaveLength(0);
  });

  it('applies the streak multiplier from banked history', async () => {
    const { api, user } = await newUser('adam@test.se');
    const habit = await api.habits.create({ type: 'daily', name: 'Run' });
    // Bank a 10 day streak: backdate creation (streaks never look before
    // createdOn) and insert history directly.
    await handle.db
      .update(habitsTable)
      .set({ createdOn: addDays(today(), -10) })
      .where(eq(habitsTable.id, habit.id));
    await handle.db.insert(habitCompletions).values(
      Array.from({ length: 10 }, (_, i) => ({
        habitId: habit.id,
        userId: user.id,
        date: addDays(today(), -(i + 1)),
      })),
    );

    const on = await api.completions.toggle({ habitId: habit.id, date: today() });
    // 10 × 1.5 (capped) = 15, plus perfect day 20
    expect(on.xpDelta).toBe(35);
    expect(on.habitStreak).toBe(11);

    const events = await ledger(user.id);
    const habitEvent = events.find((e) => e.source === 'habit');
    expect(habitEvent?.amount).toBe(15);
  });

  it('awards the perfect day bonus exactly once and revokes it correctly', async () => {
    const { api, user } = await newUser('adam@test.se');
    const a = await api.habits.create({ type: 'daily', name: 'A' });
    const b = await api.habits.create({ type: 'daily', name: 'B' });

    const first = await api.completions.toggle({ habitId: a.id, date: today() });
    expect(first.perfectDay).toBe(false);
    expect(first.xpDelta).toBe(10);

    const second = await api.completions.toggle({ habitId: b.id, date: today() });
    expect(second.perfectDay).toBe(true);
    expect(second.xpDelta).toBe(30);

    // Toggling B off revokes both its XP and the perfect day bonus.
    const undo = await api.completions.toggle({ habitId: b.id, date: today() });
    expect(undo.xpDelta).toBe(-30);
    const events = await ledger(user.id);
    expect(events.filter((e) => e.source === 'perfect_day')).toHaveLength(0);
  });

  it('accepts yesterday, rejects older dates and the future', async () => {
    const { api } = await newUser('adam@test.se');
    const habit = await api.habits.create({ type: 'daily', name: 'X' });
    // Make the habit exist yesterday too.
    await handle.db
      .update(habitsTable)
      .set({ createdOn: addDays(today(), -5) })
      .where(eq(habitsTable.id, habit.id));

    const yesterday = await api.completions.toggle({ habitId: habit.id, date: addDays(today(), -1) });
    expect(yesterday.completed).toBe(true);

    await expect(
      api.completions.toggle({ habitId: habit.id, date: addDays(today(), -3) }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(
      api.completions.toggle({ habitId: habit.id, date: addDays(today(), 1) }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects toggling archived habits', async () => {
    const { api } = await newUser('adam@test.se');
    const habit = await api.habits.create({ type: 'daily', name: 'Old' });
    await api.habits.archive({ id: habit.id });
    await expect(
      api.completions.toggle({ habitId: habit.id, date: today() }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('ownership', () => {
  it("never exposes another user's resources (NOT_FOUND, no existence leak)", async () => {
    const alice = await newUser('alice@test.se');
    const bob = await newUser('bob@test.se');
    const habit = await alice.api.habits.create({ type: 'daily', name: 'Private' });

    await expect(
      bob.api.completions.toggle({ habitId: habit.id, date: today() }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      bob.api.habits.update({ id: habit.id, name: 'Hijack' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(bob.api.habits.archive({ id: habit.id })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    expect(await bob.api.habits.list({})).toHaveLength(0);
  });
});

describe('weekly habits', () => {
  it('tracks week count and weekly streak (current week grace)', async () => {
    const { api, user } = await newUser('adam@test.se');
    const gym = await api.habits.create({ type: 'weekly', name: 'Gym', targetPerWeek: 2 });

    // Backdate creation and bank target-met completions in the two previous ISO weeks.
    const monday = mondayOfWeek(today());
    await handle.db
      .update(habitsTable)
      .set({ createdOn: addDays(monday, -14) })
      .where(eq(habitsTable.id, gym.id));
    await handle.db.insert(habitCompletions).values(
      [-14, -13, -7, -6].map((offset) => ({
        habitId: gym.id,
        userId: user.id,
        date: addDays(monday, offset),
      })),
    );

    await api.completions.toggle({ habitId: gym.id, date: today() });
    const [row] = await api.habits.list({});
    expect(row?.weekCount).toBe(1); // one of two this week
    expect(row?.currentStreak).toBe(2); // two previous weeks met; this week under grace
    expect(row?.completedToday).toBe(true);
  });

  it('enforces one completion per habit per day at the database level', async () => {
    const { api, user } = await newUser('adam@test.se');
    const gym = await api.habits.create({ type: 'weekly', name: 'Gym', targetPerWeek: 2 });
    await api.completions.toggle({ habitId: gym.id, date: today() });

    await expect(
      handle.db.insert(habitCompletions).values({
        habitId: gym.id,
        userId: user.id,
        date: today(),
      }),
    ).rejects.toThrow();
  });
});

describe('tasks', () => {
  it('awards and reverses task XP through the ledger', async () => {
    const { api, user } = await newUser('adam@test.se');
    const task = await api.tasks.create({ title: 'set up tmux' });

    const completed = await api.tasks.complete({ id: task.id });
    expect(completed.xpDelta).toBe(5);
    expect(await ledger(user.id)).toHaveLength(1);

    // Idempotent.
    expect((await api.tasks.complete({ id: task.id })).xpDelta).toBe(0);
    expect(await ledger(user.id)).toHaveLength(1);

    const undone = await api.tasks.uncomplete({ id: task.id });
    expect(undone.xpDelta).toBe(-5);
    expect(await ledger(user.id)).toHaveLength(0);
  });

  it('removes ledger XP when deleting a completed task', async () => {
    const { api, user } = await newUser('adam@test.se');
    const task = await api.tasks.create({ title: 'fix nvim config' });
    await api.tasks.complete({ id: task.id });
    await api.tasks.delete({ id: task.id });
    expect(await ledger(user.id)).toHaveLength(0);
    expect((await api.tasks.list()).open).toHaveLength(0);
  });
});

describe('stats', () => {
  it('summary reflects the day after a completion', async () => {
    const { api } = await newUser('adam@test.se');
    const habit = await api.habits.create({ type: 'daily', name: 'Meditate' });
    await api.completions.toggle({ habitId: habit.id, date: today() });

    const summary = await api.stats.summary();
    expect(summary.totalXp).toBe(30);
    expect(summary.level.level).toBe(1);
    expect(summary.today).toMatchObject({ scheduled: 1, completed: 1, perfect: true });
    expect(summary.creature).toEqual({ stage: 'egg', mood: 'thriving', level: 1 });
  });

  it('xpHistory and heatmap agree with the ledger', async () => {
    const { api } = await newUser('adam@test.se');
    const habit = await api.habits.create({ type: 'daily', name: 'Read' });
    await api.completions.toggle({ habitId: habit.id, date: today() });

    const history = await api.stats.xpHistory({ days: 7 });
    expect(history).toHaveLength(7);
    expect(history.at(-1)).toEqual({ date: today(), xp: 30 });

    const heatmap = await api.stats.heatmap({ from: today(), to: today() });
    expect(heatmap).toEqual([{ date: today(), rate: 1, count: 1 }]);
  });

  it('habitDetail reports streaks and day statuses', async () => {
    const { api } = await newUser('adam@test.se');
    const habit = await api.habits.create({ type: 'daily', name: 'Stretch' });
    await api.completions.toggle({ habitId: habit.id, date: today() });

    const detail = await api.stats.habitDetail({ habitId: habit.id });
    expect(detail.currentStreak).toBe(1);
    expect(detail.bestStreak).toBe(1);
    expect(detail.last14.at(-1)).toEqual({ date: today(), status: 'done' });
    // Days before the habit existed are unscheduled, not missed.
    expect(detail.last14[0]?.status).toBe('unscheduled');
  });

  it('records derives all-time milestones', async () => {
    const { api } = await newUser('adam@test.se');
    const habit = await api.habits.create({ type: 'daily', name: 'Run' });

    const empty = await api.stats.records();
    expect(empty).toEqual({ longestStreak: 0, bestDay: null, perfectDays: 0, totalCompletions: 0 });

    // Backdate creation so yesterday counts (completions only land on days
    // the habit existed), then log yesterday + today: a 2 day streak.
    await handle.db
      .update(habitsTable)
      .set({ createdOn: addDays(today(), -1) })
      .where(eq(habitsTable.id, habit.id));
    await api.completions.toggle({ habitId: habit.id, date: addDays(today(), -1) });
    await api.completions.toggle({ habitId: habit.id, date: today() });

    const records = await api.stats.records();
    expect(records.longestStreak).toBe(2);
    expect(records.perfectDays).toBe(2);
    expect(records.totalCompletions).toBe(2);
    // Today's habit XP carries the streak multiplier (10 × 1.05 ≈ 11),
    // plus the 20 XP perfect day bonus on both days.
    expect(records.bestDay).toEqual({ date: today(), xp: 31 });
  });
});

describe('creature', () => {
  it('renames', async () => {
    const { api } = await newUser('adam@test.se');
    await api.creature.rename({ name: 'Mochi' });
    expect((await api.creature.get()).name).toBe('Mochi');
  });
});
