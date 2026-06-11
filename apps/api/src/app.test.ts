import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from '@habit/shared';
import { app } from './app.js';

describe('GET /health', () => {
  it('returns ok and matches the shared schema', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body: unknown = await res.json();
    expect(healthResponseSchema.parse(body)).toEqual({ status: 'ok' });
  });
});
