import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb, type Db, type DbHandle } from '../db/client.js';

/** Matches docker-compose's init script; CI/sandbox override via env. */
export const TEST_DB_URL =
  process.env['TEST_DATABASE_URL'] ?? 'postgres://habit:habit@localhost:5432/habitquest_test';

/** Connect and bring the schema up from zero — migrations are themselves under test. */
export async function initTestDb(): Promise<DbHandle> {
  const handle = createDb(TEST_DB_URL);
  await migrate(handle.db, {
    migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
  });
  return handle;
}

export async function resetDb(db: Db): Promise<void> {
  await db.execute(
    sql`truncate table users, habits, habit_completions, xp_events, tasks, creatures restart identity cascade`,
  );
}
