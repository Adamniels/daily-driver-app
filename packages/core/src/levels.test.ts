import { describe, expect, it } from 'vitest';
import { levelFromTotalXp, xpRequiredForLevel } from './levels.js';

describe('xpRequiredForLevel', () => {
  it('matches the documented reference values', () => {
    expect(xpRequiredForLevel(1)).toBe(100);
    expect(xpRequiredForLevel(2)).toBe(246);
    expect(xpRequiredForLevel(3)).toBe(417);
    expect(xpRequiredForLevel(4)).toBe(606);
  });

  it('is strictly increasing for levels 1..100', () => {
    for (let n = 1; n < 100; n++) {
      expect(xpRequiredForLevel(n + 1)).toBeGreaterThan(xpRequiredForLevel(n));
    }
  });

  it('rejects invalid levels', () => {
    expect(() => xpRequiredForLevel(0)).toThrow(RangeError);
    expect(() => xpRequiredForLevel(1.5)).toThrow(RangeError);
  });
});

describe('levelFromTotalXp', () => {
  it('starts at level 1 with zero XP', () => {
    expect(levelFromTotalXp(0)).toEqual({
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: 100,
      progress: 0,
    });
  });

  it('levels up exactly at the threshold', () => {
    expect(levelFromTotalXp(99).level).toBe(1);
    expect(levelFromTotalXp(100).level).toBe(2);
    expect(levelFromTotalXp(100).xpIntoLevel).toBe(0);
    expect(levelFromTotalXp(100).xpForNextLevel).toBe(246);
  });

  it('reaches level 5 at the documented cumulative total (1369)', () => {
    expect(levelFromTotalXp(1368).level).toBe(4);
    expect(levelFromTotalXp(1369).level).toBe(5);
  });

  it('keeps progress in [0, 1)', () => {
    for (const xp of [0, 1, 99, 100, 345, 346, 1368, 1369, 50_000]) {
      const info = levelFromTotalXp(xp);
      expect(info.progress).toBeGreaterThanOrEqual(0);
      expect(info.progress).toBeLessThan(1);
      expect(info.xpIntoLevel).toBeLessThan(info.xpForNextLevel);
    }
  });

  it('treats negative or fractional XP defensively', () => {
    expect(levelFromTotalXp(-50).level).toBe(1);
    expect(levelFromTotalXp(99.9).level).toBe(1);
  });
});
