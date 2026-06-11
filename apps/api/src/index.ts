import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createApp } from './app.js';
import { createDb } from './db/client.js';
import { env } from './env.js';

const { db } = createDb(env.DATABASE_URL);

// Migrations run at boot: a personal instance should never be "behind".
await migrate(db, {
  migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
});

const app = createApp({
  db,
  config: { jwtSecret: env.JWT_SECRET, allowMultiUser: env.ALLOW_MULTI_USER },
});

serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
