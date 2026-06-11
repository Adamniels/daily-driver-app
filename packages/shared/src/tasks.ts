import { z } from 'zod';
import { uuidSchema } from './common.js';

export const taskCreateInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  notes: z.string().max(2000).optional(),
  /** ISO datetime; local notification scheduling happens client side. */
  remindAt: z.iso.datetime({ offset: true }).optional(),
});

export const taskUpdateInputSchema = z.object({
  id: uuidSchema,
  title: z.string().trim().min(1).max(120).optional(),
  notes: z.string().max(2000).nullable().optional(),
  remindAt: z.iso.datetime({ offset: true }).nullable().optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateInputSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateInputSchema>;
