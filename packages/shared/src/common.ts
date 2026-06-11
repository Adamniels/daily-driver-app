import { isDateString } from '@habit/core';
import { z } from 'zod';

/** 'YYYY-MM-DD', validated as a real calendar date (rejects 2026-02-30). */
export const dateStringSchema = z
  .string()
  .refine(isDateString, { message: 'must be a valid YYYY-MM-DD date' });

export const weekdaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

/** Palette tokens the app maps to actual colors; the API stores the token. */
export const colorTokenSchema = z.enum(['violet', 'mint', 'coral', 'sunshine', 'sky', 'rose']);

export type ColorToken = z.infer<typeof colorTokenSchema>;

export const uuidSchema = z.uuid();

export const idInputSchema = z.object({ id: uuidSchema });
