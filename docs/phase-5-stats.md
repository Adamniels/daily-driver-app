# Phase 5 — Stats Dashboard

**Status:** Done (2026-06-11) — review passed after layout fixes (level ring, rate bar)
**Depends on:** Phase 4
**Blocks:** nothing (Phase 6 is independent)

## Goal

The data dense counterpart to the playful home screen. Answers at a glance: am I consistent, are streaks alive, is XP trending up, which habits are weak.

## Screen layout (scrollable sections)

### 1. Summary row
Three stat chips: **Level** (with mini XP progress ring), **Total XP**, **Active streaks** (habits with streak ≥ 2). Data: `stats.summary`.

### 2. Year heatmap
GitHub style grid, 53 weeks × 7 days, colored by daily completion rate (5 intensity steps of the violet token, empty = soft gray). Built as custom SVG (no chart library needed): ~3px gap, rounded cells, month labels on top, horizontal scroll with current week anchored right. Tap a cell → small popover: date, `3/4 habits`, XP earned. Data: `stats.heatmap` (shape fixed in core's `heatmapData`).

### 3. XP over time
Area chart of XP per day, last 30 days, 7 day rolling average line. Custom SVG path with smoothing (catmull rom → bezier); axis labels minimal (start, mid, end dates). If a maintained chart library is clearly better at build time, allowed, but no heavy dependency for one chart. Data: `stats.xpHistory`.

### 4. Per habit cards
One card per active habit: emoji + name, current streak 🔥 and best streak 🏆, 30 day completion rate as a small horizontal bar, last 14 days as mini dot row (filled/empty/gray for unscheduled). Sorted by current streak descending, so dying streaks surface near the bottom. Data: `stats.habitDetail`.

### 5. Records strip
Small horizontal scroll of earned milestones, derived (no schema): longest streak ever, most XP in a day, perfect days count, total completions. Quietly seeds a future achievements system without building one now.

## Implementation notes

- Heatmap and area chart are pure presentation components taking core computed data; snapshot tests in app are optional, the math already lives in core where it is tested.
- All numbers count up on first mount (Reanimated), consistent with the app's "everything animates" rule.
- Empty states: under 7 days of history → heatmap shows with a friendly "early days!" note instead of looking broken.

## Implementation notes (2026-06-11)

- **Records are served by a new `stats.records` endpoint** (longest streak
  ever incl. archived habits, best XP day from the ledger, perfect days
  count, total completions). "Derived, no schema" held — no DB changes —
  but client-side derivation would have been wrong (only 30 days of
  history) or N+1 queries. Covered by an integration test.
- **One HTTP round trip** holds via the tRPC batch link: summary, heatmap,
  xpHistory, records and one habitDetail per habit fire together as a
  single batched request.
- **xpHistory is fetched once with days: 365**: the chart slices the last
  30, the heatmap popover joins per day XP from the same data.
- **Heatmap popover** shows date, completion count, rate and XP. The spec's
  "3/4 habits" needs per day scheduled counts, which core's HeatmapCell
  (fixed shape) doesn't carry — rate covers the same signal.
- **No emoji rule** (Adam, review 1): per habit cards use the flame and a
  trophy SVG icon instead of the spec's 🔥/🏆.
- Count-up numbers use requestAnimationFrame (identical native/web) rather
  than a Reanimated text trick that is flaky on react-native-web.

## Acceptance criteria

- [ ] Heatmap renders a full year for an account with sparse data without layout glitches, scrolls smoothly at 60fps on iOS simulator and web
- [ ] Cell popover shows correct per day detail
- [ ] XP chart matches ledger sums (spot check against direct DB query)
- [x] Per habit dot rows correctly gray out unscheduled days
- [x] Screen loads in one query round trip per section, with skeleton placeholders
