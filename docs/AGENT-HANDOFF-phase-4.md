# Agent Handoff — Implement Phase 4 (App Foundation + Home Screen)

You are picking up Habit Quest, a personal gamified habit tracker for Adam
(MSc IT student, backend/architecture focused, values clean architecture and
honest tradeoffs over quick hacks). Phases 1–3 are done and committed. Your
job is Phase 4: the Expo app foundation and the creature home screen.

## Read first, in this order

1. `PLAN.md` — vision, stack decisions, gamification rules
2. `docs/README.md` — phase status table + key invariants (memorize these)
3. `docs/phase-4-app-home.md` — your spec for this phase
4. `packages/core/src/` — the domain API you'll consume (it is fully tested; do not reimplement rules in the UI)
5. `apps/api/src/trpc/router.ts` — the AppRouter type you'll import

## What exists (phases 1–3, all verified green)

- **Monorepo**: pnpm workspaces + Turborepo. `@habit/core` (pure gamification
  engine, 64 tests), `@habit/shared` (zod contract schemas), `@habit/api`
  (Hono + tRPC v11 + Drizzle/Postgres, 24 tests incl. 19 integration).
  `apps/app/` is an empty placeholder package — that's where you work.
- **Auth**: email+password (argon2id), JWT bearer (30d), registration locks
  after the first user. `auth.register` takes optional `creatureName` and
  `timezone` (IANA).
- **The toggle contract**: `completions.toggle({habitId, date})` returns
  `{ completed, date, habitStreak, xpDelta, totalXp, level, creature,
  perfectDay }` — everything needed to animate XP, level ups, evolution and
  perfect day celebrations without refetching. Server only accepts date =
  today or yesterday in the user's timezone.
- **Other routers**: `habits.list/create/update/archive/unarchive` (list rows
  carry `currentStreak`, `bestStreak`, `completedToday`, `weekCount`),
  `tasks.*`, `stats.summary/heatmap/xpHistory/habitDetail`, `creature.get/rename`.

## Non negotiable invariants

1. Gamification rules live in `@habit/core` only. The UI renders engine
   output; it never computes XP, streaks, stages or moods itself.
2. Day logic uses user local `YYYY-MM-DD` strings. The app computes "today"
   in the device timezone and sends it; reuse core's date helpers.
3. Optimistic UI everywhere: tap responds instantly via TanStack Query
   `onMutate`, server reconciles, errors roll back visibly (shake + toast).
4. tRPC types come from `import type { AppRouter } from '@habit/api'` —
   compile time contract, no manual response types.
5. TypeScript strict passes, ESLint (type aware) passes, no skipped tests.
   `pnpm check` from repo root must stay green.

## Conventions in this repo

- Conventional commits (`feat(app): ...`), docs updated in the same commit
  when implementation diverges from spec ("docs never lie" rule).
- Phase doc status field + `docs/README.md` table updated when done.
- Exact dependency versions chosen at implementation time from current
  official docs (check Expo SDK version and its required RN/Reanimated/
  NativeWind versions before scaffolding; don't trust training data).
- Design language for the app is specified in `docs/phase-4-app-home.md`
  (playful: cream background, violet/mint/coral/sunshine palette, big radii,
  springs not easings, Nunito-style rounded font). Habit `color` values from
  the API are palette token names: violet, mint, coral, sunshine, sky, rose.

## Environment quirks that will bite you otherwise

- **Two platforms share the folder**: Adam's Mac and the sandbox each install
  their own `node_modules`. Never run package commands directly against the
  user folder from the sandbox — rsync (excluding node_modules, .turbo, .git)
  to a sandbox work dir, build/test there, then copy changed lockfile and
  generated artifacts back.
- **pnpm 11** blocks postinstall scripts: new native deps may need an entry
  under `allowBuilds` in `pnpm-workspace.yaml`.
- **Turbo 2 strict env**: env vars a task needs at runtime must be declared
  in `turbo.json` (`TEST_DATABASE_URL` already is). `EXPO_PUBLIC_*` vars are
  inlined by Expo at bundle time instead.
- Background processes die between sandbox shell calls — anything that needs
  a server (e.g. test Postgres via the `~/pgsrv/start-pg.mjs` embedded-postgres
  setup, port 5433) must start inside the same shell call that uses it.
- Adam runs iOS simulator / device builds on his Mac — you cannot. Hand him
  exact commands and verify what you can headlessly (typecheck, lint, unit
  tests, `expo export --platform web` as a render sanity check).
- Occasional transient `.git/index.lock` from the Mac side: retry, never
  force remove without checking.

## Phase 4 deliverables (summary — the spec is the source of truth)

1. Expo app in `apps/app` with Expo Router, tRPC + TanStack Query client
   (typed by AppRouter), NativeWind, Reanimated, react-native-svg, token
   storage behind one interface (expo-secure-store native / localStorage web).
2. Auth screens (login/register, register asks display name + creature name).
3. Home screen: creature (SVG stages × moods with idle animations), level
   badge + animated XP bar, today's habit list with the optimistic check off
   loop (pop, +XP particle, creature reaction, level up celebration, rollback
   on error).
4. Habits management (list with streak flames, create/edit/archive form).
5. Acceptance criteria checklist at the bottom of `docs/phase-4-app-home.md`.

## Working agreement with Adam

Foundations were built head on; UI lands in visible chunks with his look and
feel review between each. Build the app shell + auth + home screen, verify
everything you can headlessly, commit, then hand Adam run instructions and
collect his feedback before polishing further. Ask questions only when an
answer genuinely changes what you build; otherwise decide, state the
assumption, and document it.
