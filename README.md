# Habit Quest

Personal gamified habit tracker. Habits earn XP, streaks multiply it, and a small companion
creature grows and evolves with your consistency.

- **Vision and decisions:** [PLAN.md](PLAN.md)
- **Detailed phase specs and status:** [docs/](docs/README.md)

## Architecture

One Expo codebase (iOS + web) · Hono + tRPC API · Postgres (Drizzle) · pure TypeScript
gamification engine shared by api and app.

```
apps/app        Expo app: Expo Router, TanStack Query + tRPC client, NativeWind, Reanimated
apps/api        Hono + tRPC v11 server, Drizzle ORM, argon2id auth, JWT sessions
packages/core   gamification rules (XP, levels, streaks, creature) — pure, zero deps, unit tested
packages/shared zod schemas + contract types shared by api and app
```

Key invariants (enforced across every phase, see [docs/README.md](docs/README.md)):
rules live only in `core`; XP is an append only ledger and everything else is derived;
the app gets its types from `import type { AppRouter } from '@habit/api'`, so contract
breaks are compile errors; optimistic UI everywhere with visible rollback.

## Quickstart

Requirements: Node 22+ (`.nvmrc`), pnpm (via `corepack enable`), Docker.

```bash
pnpm install          # install workspace
cp .env.example .env  # local config (defaults work with docker-compose)
pnpm db:up            # start Postgres (db: habitquest, test db: habitquest_test)
```

Then, in two terminals:

```bash
pnpm --filter @habit/api dev   # API on :3001 (migrations run at boot)
pnpm --filter @habit/app dev   # Expo dev server → press i (iOS simulator) or w (web)
```

Verify the API: `curl http://localhost:3001/health` → `{"status":"ok"}`.
First launch: register (one account per instance), name your companion, start checking
things off. A physical device needs `EXPO_PUBLIC_API_URL` pointing at your Mac's LAN address.

## Scripts

| Command | What |
|---|---|
| `pnpm check` | lint + typecheck + test, the "is everything fine" button |
| `pnpm test` | vitest across all packages (api tests need `TEST_DATABASE_URL`) |
| `pnpm lint` | eslint (type aware) |
| `pnpm typecheck` | `tsc --noEmit` per package |
| `pnpm format` | prettier write |
| `pnpm db:up` / `pnpm db:down` | local Postgres via docker compose |

## CI

GitHub Actions runs lint, typecheck and the full test suite (with a Postgres service
container) on every push — see [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Deployment

Deliberately not done yet — the plan (Neon + Fly/Railway + EAS/TestFlight + static web)
lives in [docs/phase-7-polish-deploy.md](docs/phase-7-polish-deploy.md), Part B.
