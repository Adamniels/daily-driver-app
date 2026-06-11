import type { Db } from '../db/client.js';
import type { users } from '../db/schema.js';

export type UserRow = typeof users.$inferSelect;

export interface AppConfig {
  jwtSecret: string;
  allowMultiUser: boolean;
}

/**
 * A type alias (not an interface) on purpose: the Hono tRPC adapter requires
 * Record<string, unknown> compatibility, which interfaces don't satisfy
 * implicitly.
 */
export type Context = {
  db: Db;
  /** Authenticated user row, or null. Set from the bearer token, never from input. */
  user: UserRow | null;
  config: AppConfig;
};
