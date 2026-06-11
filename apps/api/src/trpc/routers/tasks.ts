import { TRPCError } from '@trpc/server';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { TASK_XP } from '@habit/core';
import { idInputSchema, taskCreateInputSchema, taskUpdateInputSchema } from '@habit/shared';
import type { Db } from '../../db/client.js';
import { tasks, xpEvents } from '../../db/schema.js';
import { todayInTimeZone } from '../../lib/dates.js';
import { protectedProcedure, router } from '../trpc.js';

async function ownedTask(db: Db, userId: string, id: string) {
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .limit(1);
  if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
  return row;
}

export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const open = await ctx.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, ctx.user.id), isNull(tasks.completedAt)))
      .orderBy(desc(tasks.createdAt));
    const recentlyDone = await ctx.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, ctx.user.id), isNotNull(tasks.completedAt)))
      .orderBy(desc(tasks.completedAt))
      .limit(20);
    return { open, recentlyDone };
  }),

  create: protectedProcedure.input(taskCreateInputSchema).mutation(async ({ ctx, input }) => {
    const [created] = await ctx.db
      .insert(tasks)
      .values({
        userId: ctx.user.id,
        title: input.title,
        notes: input.notes ?? null,
        remindAt: input.remindAt ? new Date(input.remindAt) : null,
      })
      .returning();
    if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    return created;
  }),

  update: protectedProcedure.input(taskUpdateInputSchema).mutation(async ({ ctx, input }) => {
    await ownedTask(ctx.db, ctx.user.id, input.id);
    const [updated] = await ctx.db
      .update(tasks)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.remindAt !== undefined && {
          remindAt: input.remindAt === null ? null : new Date(input.remindAt),
        }),
      })
      .where(eq(tasks.id, input.id))
      .returning();
    return updated;
  }),

  /** Completing a task awards TASK_XP via the ledger. Idempotent. */
  complete: protectedProcedure.input(idInputSchema).mutation(({ ctx, input }) =>
    ctx.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)))
        .limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      if (row.completedAt) return { task: row, xpDelta: 0 };

      const [updated] = await tx
        .update(tasks)
        .set({ completedAt: new Date() })
        .where(eq(tasks.id, row.id))
        .returning();
      await tx.insert(xpEvents).values({
        userId: ctx.user.id,
        amount: TASK_XP,
        source: 'task',
        sourceId: row.id,
        date: todayInTimeZone(ctx.user.timezone),
      });
      return { task: updated, xpDelta: TASK_XP };
    }),
  ),

  uncomplete: protectedProcedure.input(idInputSchema).mutation(({ ctx, input }) =>
    ctx.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)))
        .limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      if (!row.completedAt) return { task: row, xpDelta: 0 };

      const [updated] = await tx
        .update(tasks)
        .set({ completedAt: null })
        .where(eq(tasks.id, row.id))
        .returning();
      const removed = await tx
        .delete(xpEvents)
        .where(
          and(
            eq(xpEvents.userId, ctx.user.id),
            eq(xpEvents.source, 'task'),
            eq(xpEvents.sourceId, row.id),
          ),
        )
        .returning({ amount: xpEvents.amount });
      return { task: updated, xpDelta: -removed.reduce((acc, r) => acc + r.amount, 0) };
    }),
  ),

  /** Deleting a completed task also removes its ledger event: no orphan XP. */
  delete: protectedProcedure.input(idInputSchema).mutation(({ ctx, input }) =>
    ctx.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)))
        .limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      await tx
        .delete(xpEvents)
        .where(
          and(
            eq(xpEvents.userId, ctx.user.id),
            eq(xpEvents.source, 'task'),
            eq(xpEvents.sourceId, row.id),
          ),
        );
      await tx.delete(tasks).where(eq(tasks.id, row.id));
      return { deletedId: row.id };
    }),
  ),
});
