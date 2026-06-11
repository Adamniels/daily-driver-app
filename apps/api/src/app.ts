import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import type { HealthResponse } from '@habit/shared';
import { verifyToken } from './auth/jwt.js';
import type { Db } from './db/client.js';
import { users } from './db/schema.js';
import { appRouter } from './trpc/router.js';
import type { AppConfig, Context } from './trpc/context.js';

export interface AppDeps {
  db: Db;
  config: AppConfig;
}

/**
 * App factory: index.ts wires real env, tests wire their own DB and config.
 * Routers validate input and enforce ownership; rules live in @habit/core.
 */
export function createApp({ db, config }: AppDeps): Hono {
  const app = new Hono();

  app.use('*', cors());

  app.get('/health', async (c) => {
    let dbOk = true;
    try {
      await db.execute(sql`select 1`);
    } catch {
      dbOk = false;
    }
    const body: HealthResponse = { status: 'ok', db: dbOk };
    return c.json(body, dbOk ? 200 : 503);
  });

  app.use(
    '/trpc/*',
    trpcServer({
      router: appRouter,
      createContext: async (_opts, c): Promise<Context> => {
        let user: Context['user'] = null;
        const header = c.req.header('authorization');
        if (header?.startsWith('Bearer ')) {
          const userId = await verifyToken(header.slice('Bearer '.length), config.jwtSecret);
          if (userId) {
            const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            user = row ?? null;
          }
        }
        return { db, user, config };
      },
    }),
  );

  return app;
}
