import { TRPCError } from '@trpc/server';
import { and, asc, between, eq, sum } from 'drizzle-orm';
import {
  addDays,
  completionXp,
  creatureState,
  isPerfectDay,
  levelFromTotalXp,
  PERFECT_DAY_BONUS,
  streakForHabit,
} from '@habit/core';
import { dateRangeInputSchema, toggleInputSchema } from '@habit/shared';
import { habitCompletions, habits, xpEvents } from '../../db/schema.js';
import { todayInTimeZone } from '../../lib/dates.js';
import { toCoreCompletion, toCoreHabit } from '../../lib/mappers.js';
import { protectedProcedure, router } from '../trpc.js';

export const completionsRouter = router({
  /**
   * The one transactional endpoint of daily life. Completing inserts the
   * completion + its ledger event (streak multiplier applied), then
   * reconciles the perfect day bonus for that date. Uncompleting reverses
   * exactly those rows. Returns everything the UI needs to celebrate
   * without refetching.
   */
  toggle: protectedProcedure.input(toggleInputSchema).mutation(({ ctx, input }) =>
    ctx.db.transaction(async (tx) => {
      const today = todayInTimeZone(ctx.user.timezone);
      const yesterday = addDays(today, -1);
      if (input.date !== today && input.date !== yesterday) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Completions can only be logged for today or yesterday.',
        });
      }

      const [habitRow] = await tx
        .select()
        .from(habits)
        .where(and(eq(habits.id, input.habitId), eq(habits.userId, ctx.user.id)))
        .limit(1);
      if (!habitRow) throw new TRPCError({ code: 'NOT_FOUND' });
      if (habitRow.archivedOn) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Habit is archived.' });
      }
      if (habitRow.createdOn > input.date) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Habit did not exist yet.' });
      }

      const [existing] = await tx
        .select()
        .from(habitCompletions)
        .where(and(eq(habitCompletions.habitId, habitRow.id), eq(habitCompletions.date, input.date)))
        .limit(1);

      let completed: boolean;
      let xpDelta = 0;

      if (existing) {
        await tx.delete(habitCompletions).where(eq(habitCompletions.id, existing.id));
        const removed = await tx
          .delete(xpEvents)
          .where(
            and(
              eq(xpEvents.userId, ctx.user.id),
              eq(xpEvents.source, 'habit'),
              eq(xpEvents.sourceId, existing.id),
            ),
          )
          .returning({ amount: xpEvents.amount });
        xpDelta -= removed.reduce((acc, r) => acc + r.amount, 0);
        completed = false;
      } else {
        const priorRows = await tx
          .select()
          .from(habitCompletions)
          .where(eq(habitCompletions.userId, ctx.user.id));
        const coreHabit = toCoreHabit(habitRow);
        // Streak banked *before* this completion (grace semantics make
        // input.date the right reference for both today and yesterday).
        const streakBefore = streakForHabit(coreHabit, priorRows.map(toCoreCompletion), input.date);
        const amount = completionXp(coreHabit, streakBefore);

        const [inserted] = await tx
          .insert(habitCompletions)
          .values({ habitId: habitRow.id, userId: ctx.user.id, date: input.date })
          .returning();
        if (!inserted) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await tx.insert(xpEvents).values({
          userId: ctx.user.id,
          amount,
          source: 'habit',
          sourceId: inserted.id,
          date: input.date,
        });
        xpDelta += amount;
        completed = true;
      }

      // Perfect day reconciliation for the affected date.
      const habitRowsAll = await tx.select().from(habits).where(eq(habits.userId, ctx.user.id));
      const completionRowsNow = await tx
        .select()
        .from(habitCompletions)
        .where(eq(habitCompletions.userId, ctx.user.id));
      const coreHabits = habitRowsAll.map(toCoreHabit);
      const coreCompletions = completionRowsNow.map(toCoreCompletion);

      const perfect = isPerfectDay(coreHabits, coreCompletions, input.date);
      const [pdEvent] = await tx
        .select()
        .from(xpEvents)
        .where(
          and(
            eq(xpEvents.userId, ctx.user.id),
            eq(xpEvents.source, 'perfect_day'),
            eq(xpEvents.date, input.date),
          ),
        )
        .limit(1);

      if (perfect && !pdEvent) {
        await tx.insert(xpEvents).values({
          userId: ctx.user.id,
          amount: PERFECT_DAY_BONUS,
          source: 'perfect_day',
          date: input.date,
        });
        xpDelta += PERFECT_DAY_BONUS;
      } else if (!perfect && pdEvent) {
        await tx.delete(xpEvents).where(eq(xpEvents.id, pdEvent.id));
        xpDelta -= pdEvent.amount;
      }

      // Celebration payload.
      const [totals] = await tx
        .select({ total: sum(xpEvents.amount) })
        .from(xpEvents)
        .where(eq(xpEvents.userId, ctx.user.id));
      const totalXp = Number(totals?.total ?? 0);
      const level = levelFromTotalXp(totalXp);

      return {
        completed,
        date: input.date,
        habitStreak: streakForHabit(toCoreHabit(habitRow), coreCompletions, today),
        xpDelta,
        totalXp,
        level,
        creature: creatureState(level.level, coreHabits, coreCompletions, today),
        perfectDay: perfect,
      };
    }),
  ),

  byRange: protectedProcedure.input(dateRangeInputSchema).query(({ ctx, input }) =>
    ctx.db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.userId, ctx.user.id),
          between(habitCompletions.date, input.from, input.to),
        ),
      )
      .orderBy(asc(habitCompletions.date)),
  ),
});
