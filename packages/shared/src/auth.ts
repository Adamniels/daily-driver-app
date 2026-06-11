import { z } from 'zod';

export const registerInputSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'at least 8 characters').max(128),
  displayName: z.string().trim().min(1).max(50),
  /** "Name your companion" — the hatching moment of onboarding. */
  creatureName: z.string().trim().min(1).max(30).optional(),
  /** IANA timezone; defaults server side to Europe/Stockholm. */
  timezone: z.string().min(1).max(64).optional(),
});

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
