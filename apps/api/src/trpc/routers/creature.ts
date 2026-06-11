import { TRPCError } from '@trpc/server';
import { eq, sum } from 'drizzle-orm';
import { creatureState, levelFromTotalXp } from '@habit/core';
import { creatureRenameInputSchema } from '@habit/shared';
import { creatures, habitCompletions, habits, xpEvents } from '../../db/schema.js';
import { todayInTimeZone } from '../../lib/dates.js';
import { toCoreCompletion, toCoreHabit } from '../../lib/mappers.js';
import { protectedProcedure, router } from '../trpc.js';

export const creatureRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(creatures)
      .where(eq(creatures.userId, ctx.user.id))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

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

    const totalXp = Number(totals?.total ?? 0);
    const level = levelFromTotalXp(totalXp);

    return {
      name: row.name,
      hatchedAt: row.hatchedAt,
      totalXp,
      level,
      state: creatureState(
        level.level,
        habitRows.map(toCoreHabit),
        completionRows.map(toCoreCompletion),
        today,
      ),
    };
  }),

  rename: protectedProcedure.input(creatureRenameInputSchema).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(creatures)
      .set({ name: input.name })
      .where(eq(creatures.userId, ctx.user.id))
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  }),
});
