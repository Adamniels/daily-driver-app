/**
 * Per day data for the stats heatmap.
 *
 * A day's rate counts scheduled daily habits (done / scheduled). Completing
 * a weekly habit on a day adds one filled slot to that day — doing your
 * weekly gym session makes that day greener, but an absent weekly habit
 * never makes a day look worse.
 */
import { datesInRange } from './dates.js';
import { isActiveOn, isScheduledOn } from './schedule.js';
import type { Completion, DateString, Habit } from './types.js';

export interface HeatmapCell {
  date: DateString;
  /** 0..1 fill intensity for the cell. */
  rate: number;
  /** Total completions logged that day (daily + weekly). */
  count: number;
}

export function heatmapData(
  habits: readonly Habit[],
  completions: readonly Completion[],
  from: DateString,
  to: DateString,
): HeatmapCell[] {
  const habitById = new Map(habits.map((h) => [h.id, h]));

  const byDate = new Map<DateString, Completion[]>();
  for (const c of completions) {
    const list = byDate.get(c.date);
    if (list) list.push(c);
    else byDate.set(c.date, [c]);
  }

  return datesInRange(from, to).map((date) => {
    const todays = byDate.get(date) ?? [];

    let slots = 0;
    let done = 0;
    for (const habit of habits) {
      if (habit.type !== 'daily') continue;
      if (!isActiveOn(habit, date) || !isScheduledOn(habit, date)) continue;
      slots += 1;
      if (todays.some((c) => c.habitId === habit.id)) done += 1;
    }
    for (const c of todays) {
      const habit = habitById.get(c.habitId);
      if (habit?.type === 'weekly') {
        slots += 1;
        done += 1;
      }
    }

    return {
      date,
      rate: slots === 0 ? 0 : done / slots,
      count: todays.length,
    };
  });
}
