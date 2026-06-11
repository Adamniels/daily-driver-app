import { describe, expect, it } from 'vitest';
import {
  dateStringSchema,
  habitCreateInputSchema,
  healthResponseSchema,
  registerInputSchema,
  taskCreateInputSchema,
} from './index.js';

describe('healthResponseSchema', () => {
  it('parses a valid health response', () => {
    expect(healthResponseSchema.parse({ status: 'ok', db: true })).toEqual({
      status: 'ok',
      db: true,
    });
  });
});

describe('dateStringSchema', () => {
  it('accepts real dates and rejects impossible ones', () => {
    expect(dateStringSchema.parse('2026-06-11')).toBe('2026-06-11');
    expect(() => dateStringSchema.parse('2026-02-30')).toThrow();
    expect(() => dateStringSchema.parse('11/06/2026')).toThrow();
  });
});

describe('habitCreateInputSchema', () => {
  it('applies defaults for a daily habit', () => {
    const parsed = habitCreateInputSchema.parse({ type: 'daily', name: 'Meditate' });
    expect(parsed).toMatchObject({
      type: 'daily',
      name: 'Meditate',
      emoji: '✨',
      color: 'violet',
      baseXp: 10,
      scheduledDays: null,
    });
  });

  it('requires targetPerWeek for weekly habits', () => {
    expect(() => habitCreateInputSchema.parse({ type: 'weekly', name: 'Gym' })).toThrow();
    const parsed = habitCreateInputSchema.parse({ type: 'weekly', name: 'Gym', targetPerWeek: 4 });
    expect(parsed).toMatchObject({ type: 'weekly', targetPerWeek: 4 });
  });

  it('rejects an empty scheduledDays array (use null for every day)', () => {
    expect(() =>
      habitCreateInputSchema.parse({ type: 'daily', name: 'X', scheduledDays: [] }),
    ).toThrow();
  });
});

describe('registerInputSchema', () => {
  it('enforces password length and email shape', () => {
    expect(() =>
      registerInputSchema.parse({ email: 'no', password: 'longenough', displayName: 'A' }),
    ).toThrow();
    expect(() =>
      registerInputSchema.parse({ email: 'a@b.se', password: 'short', displayName: 'A' }),
    ).toThrow();
  });
});

describe('taskCreateInputSchema', () => {
  it('accepts an ISO remindAt with offset', () => {
    const parsed = taskCreateInputSchema.parse({
      title: 'set up tmux',
      remindAt: '2026-06-15T18:00:00+02:00',
    });
    expect(parsed.remindAt).toBe('2026-06-15T18:00:00+02:00');
  });
});
