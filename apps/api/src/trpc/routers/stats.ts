import { TRPCError } from '@trpc/server';
import { and, between, eq, gte, sql, sum } from 'drizzle-orm';
import {
  addDays,
  bestStreak,
  completionRate,
  creatureState,
  heatmapData,
  isPerfectDay,
  isScheduledOn,
  lastNDays,
  levelFromTotalXp,
  streakForHabit,
  type DateString,
} from '@habit/core';
import { dateRangeInputSchema, habitDetailInputSchema, xpHistoryInputSchema } from '@habit/shared';
import { habitCompletions, habits, xpEvents } from '../../db/schema.js';
import { todayInTimeZone } from '../../lib/dates.js';
import { toCoreCompletion, toCoreHabit } from '../../lib/mappers.js';
import { protectedProcedure, router } from '../trpc.js';

export type DayStatus = 'done' | 'missed' | 'unscheduled' | 'pending';

export const statsRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const today = todayInTimeZone(ctx.user.timezone);

    const habitRows = await ctx.db.select().from(habits).where(eq(habits.userId, ctx.user.id));
    const completionRows = await ctx.db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.userId, ctx.user.id));
    const [totals] = await ctx.db
      .select({ total: sum(xpEvents.amount) })
      .from(xpEvents)
      .where(eq(xpEvents.userId, ctx.user.id));

    const coreHabits = habitRows.map(toCoreHabit);
    const completions = completionRows.map(toCoreCompletion);
    const totalXp = Number(totals?.total ?? 0);
    const level = levelFromTotalXp(totalXp);

    const active = habitRows.filter((h) => !h.archivedOn);
    const dueToday = active.filter((h) => isScheduledOn(toCoreHabit(h), today));
    const completedToday = dueToday.filter((h) =>
      completions.some((c) => c.habitId === h.id && c.date === today),
    );

    return {
      totalXp,
      level,
      creature: creatureState(level.level, coreHabits, completions, today),
      today: {
        date: today,
        scheduled: dueToday.length,
        completed: completedToday.length,
        perfect: isPerfectDay(coreHabits, completions, today),
      },
      activeStreaks: active.filter(
        (h) => streakForHabit(toCoreHabit(h), completions, today) >= 2,
      ).length,
    };
  }),

  heatmap: protectedProcedure.input(dateRangeInputSchema).query(async ({ ctx, input }) => {
    const habitRows = await ctx.db.select().from(habits).where(eq(habits.userId, ctx.user.id));
    const completionRows = await ctx.db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.userId, ctx.user.id),
          between(habitCompletions.date, input.from, input.to),
        ),
      );
    return heatmapData(
      habitRows.map(toCoreHabit),
      completionRows.map(toCoreCompletion),
      input.from,
      input.to,
    );
  }),

  xpHistory: protectedProcedure.input(xpHistoryInputSchema).query(async ({ ctx, input }) => {
    const today = todayInTimeZone(ctx.user.timezone);
    const from = addDays(today, -(input.days - 1));

    const rows = await ctx.db
      .select({ date: xpEvents.date, total: sql<string>`sum(${xpEvents.amount})` })
      .from(xpEvents)
      .where(and(eq(xpEvents.userId, ctx.user.id), gte(xpEvents.date, from)))
      .groupBy(xpEvents.date);

    const byDate = new Map(rows.map((r) => [r.date, Number(r.total)]));
    return lastNDays(today, input.days).map((date) => ({
      date,
      xp: byDate.get(date) ?? 0,
    }));
  }),

  habitDetail: protectedProcedure.input(habitDetailInputSchema).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select()
      .from(habits)
      .where(and(eq(habits.id, input.habitId), eq(habits.userId, ctx.user.id)))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

    const completionRows = await ctx.db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.userId, ctx.user.id));
    const completions = completionRows.map(toCoreCompletion);
    const habit = toCoreHabit(row);
    const today = todayInTimeZone(ctx.user.timezone);

    const currentStreak = streakForHabit(habit, completions, today);
    const doneSet = new Set(
      completions.filter((c) => c.habitId === habit.id).map((c) => c.date),
    );

    const statusFor = (date: DateString): DayStatus => {
      if (doneSet.has(date)) return 'done';
      if (!isScheduledOn(habit, date) || habit.createdAt > date) return 'unscheduled';
      return date === today ? 'pending' : 'missed';
    };

    return {
      habit: row,
      currentStreak,
      bestStreak: Math.max(bestStreak(habit, completions), currentStreak),
      rate30: completionRate([habit], completions, today, 30),
      last14: lastNDays(today, 14).map((date) => ({ date, status: statusFor(date) })),
    };
  }),
});
