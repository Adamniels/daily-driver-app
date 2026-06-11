/**
 * @habit/shared — zod schemas and types shared between api and app.
 * Real contract schemas land in Phase 3; this proves the zod wiring.
 */
import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
