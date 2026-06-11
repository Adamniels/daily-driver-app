# Phase 1 — Monorepo Scaffold

**Status:** Done (2026-06-11) — verified in sandbox; Docker step verified on Adam's machine separately
**Depends on:** nothing
**Blocks:** all other phases

## Goal

A monorepo where `pnpm install` works first try, lint and test pass on empty packages, and Postgres runs locally with one command. Everything after this phase is product work, never tooling work.

## Deliverables

### 1. Workspace layout

```
habit-tracker-app/
  apps/
    app/                  # created in Phase 4 (placeholder package.json only)
    api/                  # filled in Phase 3 (scaffold + healthcheck now)
  packages/
    core/                 # filled in Phase 2 (scaffold now)
    shared/               # zod schemas, scaffold now
  docs/                   # these phase documents
  docker-compose.yml
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
  .env.example
  .gitignore
  README.md
```

Package names: `@habit/app`, `@habit/api`, `@habit/core`, `@habit/shared`.

### 2. Tooling

| Tool | Choice | Notes |
|---|---|---|
| Package manager | pnpm (workspaces) | verify current major at build time |
| Task runner | Turborepo | `turbo run lint test build` with caching |
| TypeScript | strict mode, `tsconfig.base.json` extended by every package | `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` |
| Lint | ESLint flat config + typescript-eslint, single root config | |
| Format | Prettier, root config, no per package overrides | |
| Tests | Vitest, workspace mode so `pnpm test` runs all packages | |
| Node | LTS at build time, pinned in `.nvmrc` and `engines` | |

Versions are intentionally not pinned in this document. At implementation time, check current stable versions via official docs and pin exact versions in package.json files.

### 3. Local database

`docker-compose.yml` with Postgres 16+:

- service `db`, port 5432, volume for persistence
- database `habitquest`, user/password from `.env`
- healthcheck so dependent scripts can wait on readiness
- a second database `habitquest_test` created via init script, used by API integration tests

### 4. Environment conventions

- `.env.example` documents every variable: `DATABASE_URL`, `TEST_DATABASE_URL`, `JWT_SECRET`, `API_PORT`, `EXPO_PUBLIC_API_URL`
- `.env` is gitignored
- API validates env at startup with zod (fails fast with a clear message), implemented in Phase 3

### 5. Root scripts

```
pnpm dev          # turbo run dev (api now, app joins in Phase 4)
pnpm test         # all vitest suites
pnpm lint         # eslint + tsc --noEmit across workspace
pnpm db:up        # docker compose up -d db
pnpm db:down      # docker compose down
```

### 6. Git

- `git init`, sensible `.gitignore` (node_modules, .env, .expo, dist, .turbo)
- First commit after this phase passes acceptance criteria
- Conventional commit style (`feat:`, `fix:`, `chore:`, `docs:`) for readable history

## Acceptance criteria

- [ ] `pnpm install` completes cleanly from a fresh clone
- [ ] `pnpm lint` and `pnpm test` pass (placeholder test in each package)
- [ ] `pnpm db:up` produces a healthy Postgres container with both databases
- [ ] `tsc --noEmit` passes in every package with strict settings
- [ ] README has a 5 minute quickstart (clone → install → db:up → dev)
