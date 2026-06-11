/**
 * Environment loading + validation. Fails fast at startup with a readable
 * message instead of failing mysteriously at first query.
 *
 * Only the entrypoint (index.ts) imports this; everything else receives its
 * configuration through context, which keeps tests free to inject their own.
 */
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { z } from 'zod';

// Repo root .env (apps/api/src → three levels up). Missing file is fine.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  /** Personal instance stays personal: registration locks after user #1. */
  ALLOW_MULTI_USER: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:\n', z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
