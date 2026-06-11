# Phase 7 — Polish + Deployment

**Status:** Not started
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

- [ ] All three celebration moments implemented and felt good in person
- [ ] CI green on main
- [ ] API + DB deployed, healthcheck monitored by platform
- [ ] App on your physical iPhone via TestFlight, talking to prod
- [ ] Web deployed and usable from your laptop
- [ ] README accurate enough that future you (or an internship interviewer) can run everything from scratch
