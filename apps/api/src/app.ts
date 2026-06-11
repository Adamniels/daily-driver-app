import { Hono } from 'hono';
import type { HealthResponse } from '@habit/shared';

/**
 * The Hono app, exported separately from the server entrypoint so tests can
 * call `app.request()` without binding a port. tRPC mounts here in Phase 3.
 */
export const app = new Hono();

app.get('/health', (c) => {
  const body: HealthResponse = { status: 'ok' };
  return c.json(body);
});
