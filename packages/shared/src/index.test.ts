import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './index.js';

describe('@habit/shared scaffold', () => {
  it('parses a valid health response', () => {
    expect(healthResponseSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
  });

  it('rejects an invalid health response', () => {
    expect(() => healthResponseSchema.parse({ status: 'nope' })).toThrow();
  });
});
