# Phase 3 — API (`@habit/api`)

**Status:** Done (2026-06-11) — 24 api tests green (19 integration), boot + HTTP smoke verified
**Depends on:** Phase 1, Phase 2
**Blocks:** Phase 4

## Goal

A tRPC server on Hono with Drizzle + Postgres. Thin by design: routers validate input, enforce auth and ownership, read/write facts, and delegate every rule to `@habit/core`. If a gamification rule appears inside a router, that is a bug.

## Stack

Hono (HTTP), tRPC v11 (verify current major at build time), Drizzle ORM + drizzle-kit migrations, zod schemas imported from `@habit/shared`, argon2id for password hashing, JWT (HS256) bearer tokens. Env validated with zod at startup.

## Database schema (Drizzle)

```
users
  id            uuid pk default gen_random_uuid()
  email         text unique not null
  password_hash text not null
  display_name  text not null
  timezone      text not null default 'Europe/Stockholm'
  created_at    timestamptz not null default now()

habits
  id               uuid pk
  user_id          uuid fk → users, not null
  name             text not null
  emoji            text not null default '✨'
  color            text not null default 'violet'     -- token from app palette
  type             text not null check in ('daily','weekly')
  scheduled_days   text[] null         -- daily only; null = every day; e.g. {mon,tue,wed,thu,fri}
  target_per_week  int null            -- weekly only; 1..7
  base_xp          int not null default 10
  sort_order       int not null default 0
  created_on       date not null       -- user local day; streaks never look earlier
  archived_on      date null           -- user local day; null = active
  created_at       timestamptz not null -- audit only
  index (user_id, archived_on)

habit_completions
  id            uuid pk
  habit_id      uuid fk → habits, not null
  user_id       uuid fk → users, not null
  date          date not null            -- user local calendar date
  completed_at  timestamptz not null
  unique (habit_id, date)

xp_events
  id          uuid pk
  user_id     uuid not null
  amount      int not null
  source      text not null check in ('habit','task','perfect_day')
  source_id   uuid null                  -- completion id or task id
  date        date not null
  created_at  timestamptz not null
  index (user_id, date)

tasks
  id            uuid pk
  user_id       uuid not null
  title         text not null
  notes         text null
  remind_at     timestamptz null
  completed_at  timestamptz null
  created_at    timestamptz not null
  index (user_id, completed_at)

creatures
  user_id     uuid pk fk → users
  name        text not null default 'Blob'
  hatched_at  timestamptz not null default now()
```

Notes: client computes and sends `date` (its local calendar day) for completions, consistent with core's date policy. Domain relevant days are `date` columns (user local); `timestamptz` columns are audit metadata only. `timezone` on users is used server side to validate that toggles target today/yesterday.

## Auth

- `auth.register` — open endpoint, but the server refuses registration when a user already exists unless `ALLOW_MULTI_USER=true`. Personal instance stays personal without building invite systems.
- `auth.login` — email + password → JWT (30 day expiry). No refresh tokens in v1; relogging monthly is acceptable for a personal tool.
- Register also creates the user's creature row (hatching moment).
- tRPC context extracts and verifies the bearer token; `protectedProcedure` rejects with UNAUTHORIZED otherwise. Every query is scoped by `user_id` from the token, never from input.

## tRPC routers

All inputs/outputs validated with zod schemas defined in `@habit/shared`.

### `auth`
| Procedure | Input | Behavior |
|---|---|---|
| `register` | email, password (min 8), displayName | create user + creature, return token + user |
| `login` | email, password | verify, return token + user |
| `me` | — | current user |

### `habits`
| Procedure | Input | Behavior |
|---|---|---|
| `list` | includeArchived? | habits with computed `currentStreak`, `bestStreak`, `completedToday` (via core) |
| `create` | name, emoji, color, type, scheduledDays?, targetPerWeek?, baseXp? | validates type specific fields |
| `update` | id + partial fields | ownership checked |
| `archive` / `unarchive` | id | soft delete, history preserved |

### `completions`
| Procedure | Input | Behavior |
|---|---|---|
| `toggle` | habitId, date | The one transactional endpoint. Completing: insert completion, compute streak then XP via core, insert `habit` xp_event; if the day became perfect, insert `perfect_day` event. Uncompleting: delete completion + its xp_event, and the day's perfect_day event if it no longer qualifies. Returns new streak, xp awarded, level info, creature state, perfectDay flag so the UI can celebrate without refetching. |
| `byRange` | from, to | completions for stats/heatmap |

Rule: `toggle` only accepts `date` = today or yesterday (forgot to log before midnight is real, rewriting history is not).

### `tasks`
`list` (open + recently completed), `create` (title, notes?, remindAt?), `update`, `complete` (awards TASK_XP via ledger), `uncomplete` (removes event), `delete`.

### `stats`
| Procedure | Returns |
|---|---|
| `summary` | totalXp, level info, creature state, today's progress, active streak count |
| `heatmap` | core `heatmapData` for a date range |
| `xpHistory` | XP per day for last N days (ledger group by) |
| `habitDetail` | per habit completion rate, streak history |

### `creature`
`get`, `rename`.

## Error handling

tRPC error codes only: UNAUTHORIZED, NOT_FOUND (or other user's resource — same response, no existence leaks), BAD_REQUEST with zod details, CONFLICT (duplicate completion race, unique constraint handles it).

## Tests

- **Unit:** auth helpers (hash/verify, token roundtrip).
- **Integration (Vitest against `habitquest_test` DB):** register → login → create habit → toggle on → XP event exists with correct amount → toggle off → ledger clean again; perfect day awarded exactly once per day and revoked correctly; multiplier reflected in stored amount after building a streak (insert prior completions directly); ownership: user B cannot read or toggle user A's habit; toggle rejects dates older than yesterday; migrations run from scratch on empty DB.

## Acceptance criteria

- [ ] `pnpm --filter @habit/api dev` serves; `/health` returns ok + db check
- [ ] All integration tests green against the test database
- [ ] `drizzle-kit` migrations apply cleanly from zero
- [ ] No business rule constants in api code (all imported from core)
- [ ] curl smoke test documented in the api README
