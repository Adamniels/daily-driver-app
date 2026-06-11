import { z } from 'zod';
import { dateStringSchema, uuidSchema } from './common.js';

/**
 * Toggle is the one mutation of daily life: complete or uncomplete a habit
 * for a day. The server additionally enforces date ∈ {today, yesterday} in
 * the user's timezone — you may log "forgot before midnight", you may not
 * rewrite last week.
 */
export const toggleInputSchema = z.object({
  habitId: uuidSchema,
  date: dateStringSchema,
});

export const dateRangeInputSchema = z
  .object({
    from: dateStringSchema,
    to: dateStringSchema,
  })
  .refine((r) => r.from <= r.to, { message: 'from must not be after to' });

export type ToggleInput = z.infer<typeof toggleInputSchema>;
export type DateRangeInput = z.infer<typeof dateRangeInputSchema>;
