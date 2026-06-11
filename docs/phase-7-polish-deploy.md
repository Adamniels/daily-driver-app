# Phase 7 — Polish + Deployment

**Status:** Part A implemented 2026-06-11 (awaiting Adam's review); Part B (deployment) deliberately deferred at Adam's request
**Depends on:** Phases 4–6
**Blocks:** nothing (final phase)

## Part A — Polish

### Celebrations (upgrade from functional to delightful)
- **Level up:** full screen moment — confetti burst in palette colors, level card springs in, creature jumps. Skippable by tap.
- **Evolution:** the marquee moment, it is rare (5 times total). Screen dims, creature glows and shakes, white flash, new form pops with sparkles, name card ("Sprout!"). 3–4 seconds, worth the build time.
- **Perfect day:** last habit of the day checked → rainbow shimmer across the today list + creature hearts.

### Creature art pass
Refine the SVG stage variants now that mechanics are proven: consistent silhouette across stages, 2–3 idle animation variants per mood so it feels alive, blink loop, occasional look around.

### App identity
Name + icon (creature silhouette on violet), splash screen, web favicon/title.

### UX sweep
Empty states for all screens (new account, all done today, no tasks), loading skeletons, error toasts with consistent voice, haptics on iOS (light tick on check, success buzz on level up), dark mode if appetite remains (token system makes it cheap, still optional).

### Engineering sweep
- Root README: architecture overview, quickstart, screenshots
- `pnpm lint && pnpm test` green across workspace, no skipped tests
- GitHub Actions: lint + test on push (cheap insurance, 20 lines of yaml)

### Part A implementation notes (2026-06-11)

- **Evolution**: dedicated overlay with three beats (charge: glow swells +
  body shakes ~1.4s → white flash → reveal: new form pops with a sparkle
  ring + stage name card, ~2.4s). Tap anywhere skips. Evolution outranks
  the level up overlay when both fire on one toggle.
- **Perfect day**: rainbow band sweeps once across the today list
  (replayed per perfect day via key remount) + creature hearts + a small
  "see you tomorrow" line under the list.
- **Level up**: confetti + card as before, now with creature jump and a
  success haptic. Haptics: light tick on habit/task check, success on
  level up, heavy on evolution; no-ops on web.
- **Creature**: three layered idle loops (bob, sway, breathe) with
  different periods per mood so motion never repeats exactly, randomized
  blink loop, occasional pupil look-around. Egg and closed-eye moods skip
  blinking.
- **Identity**: generated icon set (cream blob on violet, sprout leaf),
  splash (violet blob on cream), Android adaptive icon, web favicon —
  SVG-rendered PNGs in `apps/app/assets/`.
- **UX sweep**: skeleton placeholders replaced every spinner (home,
  habits, edit, tasks; stats already had them). Dark mode deferred —
  appetite ran out exactly as the spec allowed.
- **Engineering**: README rewritten (architecture, two-terminal
  quickstart, CI section); GitHub Actions workflow runs lint, typecheck
  and all tests against a Postgres 18 service container.
- Screenshots for the README: pending — needs Adam's simulator (sandbox
  can't capture the running app).

## Part B — Deployment

Decisions deferred until here on purpose; revisit current free tiers at deploy time (assumptions below as of June 2026).

### Database — managed Postgres
**Neon** free tier (serverless Postgres, branching for a test DB). Alternative: Supabase if we also want its dashboard. Migration: run drizzle migrations against the prod URL from CI or locally.

### API — Fly.io or Railway
Dockerfile for `@habit/api` (multi stage, pnpm prune for prod). Env: `DATABASE_URL`, `JWT_SECRET` (generated fresh, never the dev one), `ALLOW_MULTI_USER=false`. `/health` wired to the platform's health checks. Either platform's free/hobby tier carries a single user API trivially.

### iOS app on your iPhone — EAS Build
- Apple Developer account needed: free account = 7 day reinstall cycle, **paid ($99/yr) + TestFlight = the realistic path for daily use**, App Store submission optional and not a v1 goal.
- `eas build --profile production --platform ios` → TestFlight via `eas submit`.
- `EXPO_PUBLIC_API_URL` per build profile (dev → localhost, prod → deployed API).

### Web — static export
`expo export --platform web` → deploy to Vercel/Netlify/Cloudflare Pages free tier. Same prod API URL. Custom domain optional.

### Post deploy smoke test
Register on prod (fresh creature), create habit, check off on phone, open web → same state. Reminder fires on phone from TestFlight build. Then: **delete the dev habit of testing and start using it for real.**

## Acceptance criteria

- [ ] All three celebration moments implemented and felt good in person (Part A — awaiting review)
- [x] CI green on main (GitHub Actions workflow set up, runs lint + typecheck + full test suite)
- [ ] API + DB deployed, healthcheck monitored by platform (Part B — deferred)
- [ ] App on your physical iPhone via TestFlight, talking to prod (Part B — deferred)
- [ ] Web deployed and usable from your laptop (Part B — deferred)
- [x] README accurate enough that future you (or an internship interviewer) can run everything from scratch
