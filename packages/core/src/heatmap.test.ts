import { describe, expect, it } from 'vitest';
import { heatmapData } from './heatmap.js';
import { dailyHabit, done, weeklyHabit } from './test-helpers.js';

describe('heatmapData', () => {
  const everyday = dailyHabit({ id: 'a' });
  const weekdays = dailyHabit({ id: 'b', scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'] });
  const weekly = weeklyHabit({ id: 'w', targetPerWeek: 2 });

  it('computes per day rate and count', () => {
    const completions = [
      ...done('a', ['2026-06-08', '2026-06-09']),
      ...done('b', ['2026-06-09']),
      ...done('w', ['2026-06-09']),
    ];
    const cells = heatmapData([everyday, weekdays, weekly], completions, '2026-06-08', '2026-06-10');

    expect(cells).toEqual([
      // Mon: a done, b missed → 1/2
      { date: '2026-06-08', rate: 0.5, count: 1 },
      // Tue: a + b done, weekly completion adds a filled slot → 3/3
      { date: '2026-06-09', rate: 1, count: 3 },
      // Wed: nothing
      { date: '2026-06-10', rate: 0, count: 0 },
    ]);
  });

  it('does not penalize days where a subset habit is unscheduled', () => {
    const completions = done('a', ['2026-06-13']); // Saturday: only `a` is scheduled
    const cells = heatmapData([everyday, weekdays], completions, '2026-06-13', '2026-06-13');
    expect(cells).toEqual([{ date: '2026-06-13', rate: 1, count: 1 }]);
  });

  it('ignores archived habits and counts pre-archive history', () => {
    const retired = dailyHabit({ id: 'r', archivedAt: '2026-06-10' });
    const completions = done('r', ['2026-06-09']);
    const cells = heatmapData([retired], completions, '2026-06-09', '2026-06-10');
    expect(cells).toEqual([
      { date: '2026-06-09', rate: 1, count: 1 },
      { date: '2026-06-10', rate: 0, count: 0 }, // archived → no slot, not a miss
    ]);
  });

  it('returns zeroed cells for days with no habits yet', () => {
    const habit = dailyHabit({ id: 'a', createdAt: '2026-06-10' });
    const cells = heatmapData([habit], done('a', ['2026-06-10']), '2026-06-09', '2026-06-10');
    expect(cells).toEqual([
      { date: '2026-06-09', rate: 0, count: 0 },
      { date: '2026-06-10', rate: 1, count: 1 },
    ]);
  });
});
