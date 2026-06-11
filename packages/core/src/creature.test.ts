import { describe, expect, it } from 'vitest';
import { completionRate, creatureState, moodFromRate, stageForLevel } from './creature.js';
import { dailyHabit, done, weeklyHabit } from './test-helpers.js';

describe('stageForLevel', () => {
  it('hits every documented boundary', () => {
    expect(stageForLevel(1)).toBe('egg');
    expect(stageForLevel(2)).toBe('egg');
    expect(stageForLevel(3)).toBe('hatchling');
    expect(stageForLevel(6)).toBe('hatchling');
    expect(stageForLevel(7)).toBe('sprout');
    expect(stageForLevel(11)).toBe('sprout');
    expect(stageForLevel(12)).toBe('juvenile');
    expect(stageForLevel(19)).toBe('juvenile');
    expect(stageForLevel(20)).toBe('adult');
    expect(stageForLevel(29)).toBe('adult');
    expect(stageForLevel(30)).toBe('mythic');
    expect(stageForLevel(99)).toBe('mythic');
  });
});

describe('moodFromRate', () => {
  it('maps thresholds inclusively', () => {
    expect(moodFromRate(1)).toBe('thriving');
    expect(moodFromRate(0.8)).toBe('thriving');
    expect(moodFromRate(0.79)).toBe('happy');
    expect(moodFromRate(0.6)).toBe('happy');
    expect(moodFromRate(0.59)).toBe('okay');
    expect(moodFromRate(0.4)).toBe('okay');
    expect(moodFromRate(0.39)).toBe('sad');
    expect(moodFromRate(0.2)).toBe('sad');
    expect(moodFromRate(0.19)).toBe('sleeping');
    expect(moodFromRate(0)).toBe('sleeping');
  });

  it('treats no track record as happy', () => {
    expect(moodFromRate(null)).toBe('happy');
  });
});

describe('completionRate', () => {
  it('computes the rate for a single daily habit', () => {
    const habit = dailyHabit({ id: 'a' });
    // 5 of the last 7 days completed
    const c = done('a', ['2026-06-05', '2026-06-06', '2026-06-08', '2026-06-09', '2026-06-10']);
    expect(completionRate([habit], c, '2026-06-11')).toBeCloseTo(5 / 7, 10);
  });

  it('only counts days since the habit existed', () => {
    const habit = dailyHabit({ id: 'a', createdAt: '2026-06-09' });
    const c = done('a', ['2026-06-09', '2026-06-10', '2026-06-11']);
    expect(completionRate([habit], c, '2026-06-11')).toBe(1);
  });

  it('returns null when there is nothing to measure (new account)', () => {
    expect(completionRate([], [], '2026-06-11')).toBeNull();
    const future = dailyHabit({ id: 'a', createdAt: '2026-06-12' });
    expect(completionRate([future], [], '2026-06-11')).toBeNull();
  });

  it('mixes daily and prorated weekly habits', () => {
    // Window 2026-06-08..14 is exactly ISO week 2026-W24, so the weekly
    // habit contributes its full target with fraction 1.
    const daily = dailyHabit({ id: 'a' });
    const weekly = weeklyHabit({ id: 'w', targetPerWeek: 2 });
    const c = [
      ...done('a', ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12']),
      ...done('w', ['2026-06-09']),
    ];
    // daily: 5/7 slots, weekly: 1/2 → (5+1)/(7+2)
    expect(completionRate([daily, weekly], c, '2026-06-14')).toBeCloseTo(6 / 9, 10);
  });

  it('never exceeds 1 even when weekly completions overshoot the target', () => {
    const weekly = weeklyHabit({ id: 'w', targetPerWeek: 2 });
    const c = done('w', ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12']);
    expect(completionRate([weekly], c, '2026-06-14')).toBe(1);
  });
});

describe('creatureState', () => {
  it('combines stage from level and mood from recent rate', () => {
    const habit = dailyHabit({ id: 'a' });
    const c = done('a', [
      '2026-06-05',
      '2026-06-06',
      '2026-06-07',
      '2026-06-08',
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
    ]);
    expect(creatureState(7, [habit], c, '2026-06-11')).toEqual({
      stage: 'sprout',
      mood: 'thriving',
      level: 7,
    });
  });

  it('reads a brand new account as a happy egg', () => {
    expect(creatureState(1, [], [], '2026-06-11')).toEqual({
      stage: 'egg',
      mood: 'happy',
      level: 1,
    });
  });
});
