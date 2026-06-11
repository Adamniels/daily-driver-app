import { describe, expect, it } from 'vitest';
import { dailyHabit, done, weeklyHabit } from './test-helpers.js';
import { completionXp, isPerfectDay, streakMultiplier } from './xp.js';

describe('streakMultiplier', () => {
  it('ramps by 0.05 per banked day and caps at 1.5', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(5)).toBe(1.25);
    expect(streakMultiplier(10)).toBe(1.5);
    expect(streakMultiplier(50)).toBe(1.5);
  });

  it('clamps negative input', () => {
    expect(streakMultiplier(-3)).toBe(1);
  });
});

describe('completionXp', () => {
  it('awards exactly baseXp on a fresh habit', () => {
    expect(completionXp({ baseXp: 10 }, 0)).toBe(10);
  });

  it('applies the multiplier and rounds', () => {
    expect(completionXp({ baseXp: 10 }, 3)).toBe(12); // 10 × 1.15 = 11.5 → 12
    expect(completionXp({ baseXp: 10 }, 10)).toBe(15); // capped 1.5×
    expect(completionXp({ baseXp: 25 }, 10)).toBe(38); // 37.5 → 38
  });
});

describe('isPerfectDay', () => {
  const date = '2026-06-11'; // Thursday
  const a = dailyHabit({ id: 'a' });
  const b = dailyHabit({ id: 'b', scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'] });

  it('is true when every scheduled daily habit is completed', () => {
    const c = [...done('a', [date]), ...done('b', [date])];
    expect(isPerfectDay([a, b], c, date)).toBe(true);
  });

  it('is false when any scheduled habit is missing', () => {
    expect(isPerfectDay([a, b], done('a', [date]), date)).toBe(false);
  });

  it('is false when nothing is scheduled (empty is not perfect)', () => {
    const w = weeklyHabit({ id: 'w' });
    expect(isPerfectDay([w], done('w', [date]), date)).toBe(false);
    expect(isPerfectDay([], [], date)).toBe(false);
  });

  it('ignores habits not scheduled that day', () => {
    const saturday = '2026-06-13'; // b is Mon–Fri, so only a counts
    expect(isPerfectDay([a, b], done('a', [saturday]), saturday)).toBe(true);
  });

  it('ignores archived habits and habits created later', () => {
    const archived = dailyHabit({ id: 'old', archivedAt: '2026-06-01' });
    const future = dailyHabit({ id: 'new', createdAt: '2026-06-12' });
    expect(isPerfectDay([a, archived, future], done('a', [date]), date)).toBe(true);
  });
});
