import { describe, expect, it } from 'vitest';
import { bestStreak, dailyStreak, streakForHabit, weeklyStreak } from './streaks.js';
import { dailyHabit, done, weeklyHabit } from './test-helpers.js';

// 2026-06-11 is a Thursday. 2026-06-08 is the Monday of ISO week 2026-W24.
const TODAY = '2026-06-11';

describe('dailyStreak — every day habit', () => {
  const habit = dailyHabit({ id: 'h1' });

  it('counts an unbroken run', () => {
    const c = done('h1', ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11']);
    expect(dailyStreak(habit, c, TODAY)).toBe(4);
  });

  it("keeps yesterday's streak when today is not yet completed (grace)", () => {
    const c = done('h1', ['2026-06-08', '2026-06-09', '2026-06-10']);
    expect(dailyStreak(habit, c, TODAY)).toBe(3);
  });

  it('resets on a missed day before today', () => {
    const c = done('h1', ['2026-06-08', '2026-06-10']); // missed the 9th
    expect(dailyStreak(habit, c, TODAY)).toBe(1);
  });

  it('starts a fresh streak with a single completion today', () => {
    expect(dailyStreak(habit, done('h1', [TODAY]), TODAY)).toBe(1);
  });

  it('is zero with no completions', () => {
    expect(dailyStreak(habit, [], TODAY)).toBe(0);
  });

  it('ignores completions of other habits', () => {
    expect(dailyStreak(habit, done('other', ['2026-06-10', '2026-06-11']), TODAY)).toBe(0);
  });
});

describe('dailyStreak — scheduled subset (Mon–Fri)', () => {
  const habit = dailyHabit({ id: 'h2', scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'] });

  it('skips unscheduled days without breaking the chain', () => {
    // Fri 5th + Mon–Wed 8–10th; the weekend in between must not break it.
    const c = done('h2', ['2026-06-05', '2026-06-08', '2026-06-09', '2026-06-10']);
    expect(dailyStreak(habit, c, TODAY)).toBe(4); // today (Thu) under grace
  });

  it('does not extend the streak for completions on unscheduled days', () => {
    // Saturday completion exists but Saturday is not scheduled.
    const c = done('h2', ['2026-06-05', '2026-06-06', '2026-06-08', '2026-06-09', '2026-06-10']);
    expect(dailyStreak(habit, c, TODAY)).toBe(4);
  });
});

describe('dailyStreak — habit created mid history', () => {
  it('never walks before createdAt', () => {
    const habit = dailyHabit({ id: 'h3', createdAt: '2026-06-09' });
    const c = done('h3', ['2026-06-09', '2026-06-10']);
    expect(dailyStreak(habit, c, TODAY)).toBe(2);
  });
});

describe('weeklyStreak', () => {
  const habit = weeklyHabit({ id: 'w1', targetPerWeek: 3, createdAt: '2026-05-01' });

  it('counts consecutive weeks at target, with grace for the current week', () => {
    const c = done('w1', [
      // current week W24: only 2 so far — grace, neither counts nor breaks
      '2026-06-08',
      '2026-06-09',
      // W23 (Jun 1–7): 3 ✓
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      // W22 (May 25–31): 3 ✓
      '2026-05-25',
      '2026-05-26',
      '2026-05-27',
      // W21 (May 18–24): only 2 → chain ends here
      '2026-05-18',
      '2026-05-19',
    ]);
    expect(weeklyStreak(habit, c, TODAY)).toBe(2);
  });

  it('counts the current week once the target is met', () => {
    const c = done('w1', [
      '2026-06-08',
      '2026-06-09',
      '2026-06-10', // current week hits 3
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
    ]);
    expect(weeklyStreak(habit, c, TODAY)).toBe(2);
  });

  it('is zero when no week has met the target', () => {
    expect(weeklyStreak(habit, done('w1', ['2026-06-08']), TODAY)).toBe(0);
  });
});

describe('streakForHabit', () => {
  it('dispatches on habit type', () => {
    const d = dailyHabit({ id: 'd' });
    const w = weeklyHabit({ id: 'w', targetPerWeek: 1 });
    expect(streakForHabit(d, done('d', [TODAY]), TODAY)).toBe(1);
    expect(streakForHabit(w, done('w', [TODAY]), TODAY)).toBe(1);
  });
});

describe('bestStreak — daily', () => {
  it('finds the longest historical run', () => {
    const habit = dailyHabit({ id: 'h1' });
    // run of 3 (1st–3rd), gap on the 4th, run of 2 (5th–6th)
    const c = done('h1', ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-05', '2026-06-06']);
    expect(bestStreak(habit, c)).toBe(3);
  });

  it('bridges unscheduled days for scheduled subset habits', () => {
    const habit = dailyHabit({ id: 'h2', scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'] });
    // Thu 28th, Fri 29th, [weekend], Mon Jun 1st, Tue 2nd → run of 4
    const c = done('h2', ['2026-05-28', '2026-05-29', '2026-06-01', '2026-06-02']);
    expect(bestStreak(habit, c)).toBe(4);
  });

  it('is zero with no completions', () => {
    expect(bestStreak(dailyHabit({ id: 'x' }), [])).toBe(0);
  });
});

describe('bestStreak — weekly', () => {
  it('finds the longest run of target-met weeks', () => {
    const habit = weeklyHabit({ id: 'w1', targetPerWeek: 3, createdAt: '2026-05-01' });
    const c = done('w1', [
      // W20 (May 11–17): 3 ✓
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      // W21 (May 18–24): 3 ✓
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      // W22 (May 25–31): 1 ✗
      '2026-05-25',
      // W23 (Jun 1–7): 3 ✓
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
    ]);
    expect(bestStreak(habit, c)).toBe(2);
  });
});
