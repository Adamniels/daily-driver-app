# Phase 2 — Core Gamification Engine (`@habit/core`)

**Status:** Done (2026-06-11) — 64 tests green, zero runtime deps, no wall clock reads
**Depends on:** Phase 1
**Blocks:** Phase 3 (API computes stats via core), Phase 4 (app renders engine output)

## Goal

Every gamification rule as pure, deterministic, fully unit tested TypeScript functions. Zero runtime dependencies (date handling included). The API and the app consume this package; neither ever reimplements a rule.

## Design principles

1. **Pure functions only.** Input: completions, habits, XP events, a reference date. Output: derived state. No I/O, no clocks, no randomness. `new Date()` never appears inside core; the caller always passes "today".
2. **Calendar dates as strings.** All day level logic uses `YYYY-MM-DD` strings (type `DateString`), computed in the user's timezone by the caller. Core never touches timezones, which makes streak math trivial to test.
3. **Derived, not stored.** Level, streaks, mood, stage are computed from the ledger and completions. The DB stores facts, core computes meaning.

## Module breakdown

### `dates.ts`

Minimal date utilities on `DateString` (no library):

```ts
type DateString = string;            // 'YYYY-MM-DD', validated
addDays(d: DateString, n: number): DateString
diffDays(a: DateString, b: DateString): number
dayOfWeek(d: DateString): Weekday    // 'mon' | ... | 'sun'
isoWeekKey(d: DateString): string    // '2026-W24', for weekly streaks
lastNDays(d: DateString, n: number): DateString[]
```

### `types.ts`

Domain types used across core (and re-exported through `@habit/shared` for the API contract): `Habit`, `HabitType` (`'daily' | 'weekly'`), `Completion`, `XpEvent`, `CreatureState`, `Mood`, `Stage`, `Weekday`.

### `levels.ts`

```ts
xpRequiredForLevel(n: number): number        // 100 * n^1.3, rounded
levelFromTotalXp(totalXp: number): LevelInfo // { level, xpIntoLevel, xpForNextLevel, progress: 0..1 }
```

Reference values (also test fixtures): level 1→2 costs 100 XP, 2→3 costs 246, 3→4 costs 417, 4→5 costs 606, so reaching level 5 takes 1 369 total. Curve is monotonic, level is unbounded.

### `streaks.ts`

```ts
dailyStreak(habit, completions, today): number
weeklyStreak(habit, completions, today): number
streakForHabit(habit, completions, today): number   // dispatches on habit.type
bestStreak(habit, completions): number
```

Rules:

- **Daily habits** count consecutive *scheduled* days. Unscheduled days (e.g. weekends for a Mon–Fri habit) neither break nor extend the streak.
- **Today's grace:** if today is scheduled but not yet completed, the streak from yesterday still stands (it only breaks once the day is over). A missed scheduled day before today resets to 0.
- **Weekly habits** count consecutive ISO weeks where completions ≥ `targetPerWeek`. The current week is graceful the same way: counted if target already met, otherwise the chain up to last week stands.

### `xp.ts`

```ts
streakMultiplier(streak: number): number
// 1 + 0.05 * min(streak, 10), so capped at 1.5

completionXp(habit, streakAtCompletion): number
// round(habit.baseXp * streakMultiplier)

TASK_XP = 5
PERFECT_DAY_BONUS = 20

isPerfectDay(habits, completions, date): boolean
// every habit scheduled on `date` is completed; false if nothing is scheduled
```

XP is computed **at completion time** and written to the `xp_events` ledger by the API. Uncompleting a habit (same day toggle) deletes the corresponding event. The ledger is the source of truth for totals; core only computes amounts.

### `creature.ts`

```ts
stageForLevel(level): Stage
// egg ≥1, hatchling ≥3, sprout ≥7, juvenile ≥12, adult ≥20, mythic ≥30

completionRate(habits, completions, today, days = 7): number
// completed scheduled slots / total scheduled slots over the window;
// weekly habits contribute min(done, target) / target per week, prorated

moodFromRate(rate): Mood
// thriving ≥.8, happy ≥.6, okay ≥.4, sad ≥.2, sleeping <.2
// special case: brand new account with no scheduled history yet → 'happy'

creatureState(level, habits, completions, today): CreatureState
// { stage, mood, level } — single entry point the UI consumes
```

Evolution is permanent (level never decreases since the ledger is append only). Mood is recomputed daily and recovers as soon as recent consistency does.

### `heatmap.ts`

```ts
heatmapData(habits, completions, from, to): { date, rate, count }[]
```

Per day completion rate for the stats screen (rendering is Phase 5, data shape is decided here).

## Test plan (Vitest)

Tests are written alongside each module. Required coverage, by case not by percentage:

**levels** — reference values above, monotonicity property over levels 1 to 100, progress is in [0, 1), totalXp 0 → level 1.

**streaks/daily** — unbroken run; gap resets; unscheduled days skipped (Mon–Fri habit over a weekend keeps streak); today incomplete keeps yesterday's streak; today completed extends it; habit created mid history; empty completions → 0.

**streaks/weekly** — target met N consecutive weeks; week below target resets; current week grace; ISO week boundary (a Sunday→Monday rollover and a year boundary week).

**xp** — multiplier at streak 0, 5, 10, 50 (cap); completionXp rounding; perfect day true/false; perfect day with zero scheduled habits is false.

**creature** — every stage boundary (level 2 vs 3, 29 vs 30); every mood threshold edge (rate exactly .8, .6, .4, .2); new account special case; mixed daily and weekly rate computation.

**dates** — month/year boundaries, leap day (2028-02-29), ISO week edge cases, `lastNDays` ordering.

## Acceptance criteria

- [ ] `pnpm --filter @habit/core test` green, all cases above present
- [ ] No runtime dependencies in `@habit/core` package.json
- [ ] No `Date.now()` / `new Date()` outside `dates.ts` internals (and none that read the wall clock)
- [ ] Every exported function has a doc comment stating its rule in plain language
