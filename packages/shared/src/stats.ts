import { z } from 'zod';
import { uuidSchema } from './common.js';

export const xpHistoryInputSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
});

export const habitDetailInputSchema = z.object({
  habitId: uuidSchema,
});

export const creatureRenameInputSchema = z.object({
  name: z.string().trim().min(1).max(30),
});
