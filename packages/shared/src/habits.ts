import { z } from 'zod';
import { colorTokenSchema, uuidSchema, weekdaySchema } from './common.js';

const habitBase = {
  name: z.string().trim().min(1).max(60),
  emoji: z.string().min(1).max(8).default('✨'),
  color: colorTokenSchema.default('violet'),
  baseXp: z.number().int().min(5).max(30).default(10),
};

export const habitCreateInputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('daily'),
    ...habitBase,
    /** null = every day; otherwise a non empty subset of weekdays. */
    scheduledDays: z.array(weekdaySchema).min(1).max(7).nullable().default(null),
  }),
  z.object({
    type: z.literal('weekly'),
    ...habitBase,
    targetPerWeek: z.number().int().min(1).max(7),
  }),
]);

/**
 * Type is immutable after creation: switching daily↔weekly would silently
 * rewrite streak history semantics. Archive and recreate instead.
 */
export const habitUpdateInputSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1).max(60).optional(),
  emoji: z.string().min(1).max(8).optional(),
  color: colorTokenSchema.optional(),
  scheduledDays: z.array(weekdaySchema).min(1).max(7).nullable().optional(),
  targetPerWeek: z.number().int().min(1).max(7).optional(),
  baseXp: z.number().int().min(5).max(30).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const habitListInputSchema = z.object({
  includeArchived: z.boolean().default(false),
});

export type HabitCreateInput = z.infer<typeof habitCreateInputSchema>;
export type HabitUpdateInput = z.infer<typeof habitUpdateInputSchema>;
