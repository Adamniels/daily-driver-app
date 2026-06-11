import { TRPCError } from '@trpc/server';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { bestStreak, isoWeekKey, streakForHabit } from '@habit/core';
import {
  habitCreateInputSchema,
  habitListInputSchema,
  habitUpdateInputSchema,
  idInputSchema,
} from '@habit/shared';
import { habitCompletions, habits } from '../../db/schema.js';
import { todayInTimeZone } from '../../lib/dates.js';
import { toCoreCompletion, toCoreHabit } from '../../lib/mappers.js';
import { protectedProcedure, router } from '../trpc.js';

export const habitsRouter = router({
  list: protectedProcedure.input(habitListInputSchema).query(async ({ ctx, input }) => {
    const today = todayInTimeZone(ctx.user.timezone);

    const rows = await ctx.db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.userId, ctx.user.id),
          input.includeArchived ? undefined : isNull(habits.archivedOn),
        ),
      )
      .orderBy(asc(habits.sortOrder), asc(habits.createdAt));

    const completionRows = await ctx.db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.userId, ctx.user.id));
    const completions = completionRows.map(toCoreCompletion);
    const thisWeek = isoWeekKey(today);

    return rows.map((row) => {
      const habit = toCoreHabit(row);
      const currentStreak = streakForHabit(habit, completions, today);
      return {
        ...row,
        currentStreak,
        bestStreak: Math.max(bestStreak(habit, completions), currentStreak),
        completedToday: completions.some((c) => c.habitId === row.id && c.date === today),
        weekCount:
          row.type === 'weekly'
            ? completions.filter((c) => c.habitId === row.id && isoWeekKey(c.date) === thisWeek)
                .length
            : null,
      };
    });
  }),

  create: protectedProcedure.input(habitCreateInputSchema).mutation(async ({ ctx, input }) => {
    const today = todayInTimeZone(ctx.user.timezone);
    const [created] = await ctx.db
      .insert(habits)
      .values({
        userId: ctx.user.id,
        name: input.name,
        emoji: input.emoji,
        color: input.color,
        type: input.type,
        scheduledDays: input.type === 'daily' ? input.scheduledDays : null,
        targetPerWeek: input.type === 'weekly' ? input.targetPerWeek : null,
        baseXp: input.baseXp,
        createdOn: today,
      })
      .returning();
    if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    return created;
  }),

  update: protectedProcedure.input(habitUpdateInputSchema).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select()
      .from(habits)
      .where(and(eq(habits.id, input.id), eq(habits.userId, ctx.user.id)))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

    // Fields must match the habit's (immutable) type.
    if (row.type === 'daily' && input.targetPerWeek !== undefined) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Daily habits have no weekly target.' });
    }
    if (row.type === 'weekly' && input.scheduledDays !== undefined) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Weekly habits have no scheduled days.' });
    }

    const [updated] = await ctx.db
      .update(habits)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.emoji !== undefined && { emoji: input.emoji }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.scheduledDays !== undefined && { scheduledDays: input.scheduledDays }),
        ...(input.targetPerWeek !== undefined && { targetPerWeek: input.targetPerWeek }),
        ...(input.baseXp !== undefined && { baseXp: input.baseXp }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      })
      .where(eq(habits.id, row.id))
      .returning();
    return updated;
  }),

  archive: protectedProcedure.input(idInputSchema).mutation(async ({ ctx, input }) => {
    const today = todayInTimeZone(ctx.user.timezone);
    const [updated] = await ctx.db
      .update(habits)
      .set({ archivedOn: today })
      .where(and(eq(habits.id, input.id), eq(habits.userId, ctx.user.id)))
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  }),

  unarchive: protectedProcedure.input(idInputSchema).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(habits)
      .set({ archivedOn: null })
      .where(and(eq(habits.id, input.id), eq(habits.userId, ctx.user.id)))
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  }),
});
