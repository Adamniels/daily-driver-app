# Habit Quest 🌱

Personal gamified habit tracker. Habits earn XP, streaks multiply it, and a small companion
creature grows and evolves with your consistency.

- **Vision and decisions:** [PLAN.md](PLAN.md)
- **Detailed phase specs and status:** [docs/](docs/README.md)

## Stack

One Expo codebase (iOS + web) · Hono + tRPC API · Postgres (Drizzle) · pure TypeScript
gamification engine in `packages/core`, unit tested and shared by api and app.

```
apps/app        Expo app (Phase 4)
apps/api        Hono + tRPC server
packages/core   gamification rules (XP, levels, streaks, creature)
packages/shared zod schemas + contract types
```

## Quickstart

Requirements: Node 22+ (`.nvmrc`), pnpm (via `corepack enable`), Docker.

```bash
pnpm install          # install workspace
cp .env.example .env  # local config (defaults work with docker-compose)
pnpm db:up            # start Postgres (db: habitquest, test db: habitquest_test)
pnpm dev              # run dev servers (api on :3001)
```

Verify: `curl http://localhost:3001/health` → `{"status":"ok"}`

## Scripts

| Command | What |
|---|---|
| `pnpm check` | lint + typecheck + test, the "is everything fine" button |
| `pnpm test` | vitest across all packages |
| `pnpm lint` | eslint (type aware) |
| `pnpm typecheck` | `tsc --noEmit` per package |
| `pnpm format` | prettier write |
| `pnpm db:up` / `pnpm db:down` | local Postgres via docker compose |
