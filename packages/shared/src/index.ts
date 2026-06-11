/**
 * @habit/shared — zod schemas and types shared between api and app.
 * The API validates every input with these; the app reuses them for forms.
 */
export * from './common.js';
export * from './auth.js';
export * from './habits.js';
export * from './completions.js';
export * from './tasks.js';
export * from './stats.js';

import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  db: z.boolean(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
