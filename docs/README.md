# Habit Quest — Docs

High level vision and decisions: [`../PLAN.md`](../PLAN.md). This folder holds the detailed phase specs. Each doc carries its own **Status** field and acceptance checklist; update both as work lands so any session can pick up exactly where we left off.

## Phase status

| Phase | Doc | Status | Depends on |
|---|---|---|---|
| 1. Monorepo scaffold | [phase-1-scaffold.md](phase-1-scaffold.md) | Done (2026-06-11) | — |
| 2. Core gamification engine | [phase-2-core-engine.md](phase-2-core-engine.md) | Done (2026-06-11) | 1 |
| 3. API | [phase-3-api.md](phase-3-api.md) | Not started | 1, 2 |
| 4. App foundation + Home | [phase-4-app-home.md](phase-4-app-home.md) | Not started | 3 |
| 5. Stats dashboard | [phase-5-stats.md](phase-5-stats.md) | Not started | 4 |
| 6. Tasks + reminders | [phase-6-tasks-reminders.md](phase-6-tasks-reminders.md) | Not started | 4 |
| 7. Polish + deployment | [phase-7-polish-deploy.md](phase-7-polish-deploy.md) | Not started | 4, 5, 6 |

Statuses: `Not started` → `In progress` → `Done (YYYY-MM-DD)`.

## How we work

- **Phases 1–3 land together** (foundations, fully specified, no design feedback needed), then a checkpoint with run instructions.
- **Phases 4–6 land one at a time** with a look and feel review between each, since UI taste drives iteration.
- Claude writes and verifies the code in its sandbox; anything touching Adam's machine directly (pnpm install, iOS simulator, TestFlight) comes as exact copy paste commands.
- Specs here are the contract, but not sacred: when implementation reveals a better call, the doc gets updated in the same commit so docs never lie.
- Exact dependency versions are chosen at build time from current official docs (this is why phase docs avoid pinning).

## Key invariants (apply to every phase)

1. All gamification rules live in `@habit/core` as pure tested functions. Never in the API, never in the UI.
2. Day level logic uses user local `YYYY-MM-DD` strings computed by the client; core never reads the clock.
3. XP is an append only ledger (`xp_events`); level, streaks, stage and mood are always derived.
4. Every query in the API is scoped by the authenticated `user_id`, never by client supplied ids alone.
5. Optimistic UI everywhere: the tap responds instantly, the server reconciles, errors roll back visibly.
