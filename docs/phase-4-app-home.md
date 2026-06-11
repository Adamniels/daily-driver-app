# Phase 4 — App Foundation + Home Screen (`@habit/app`)

**Status:** In progress — implemented 2026-06-11, awaiting Adam's look and feel review on device
**Depends on:** Phase 3
**Blocks:** Phase 5, Phase 6

## Goal

The Expo app running on iOS simulator and web, with auth, the creature home screen, and the habit check off loop feeling *great*. This phase ends with the app being usable daily, even before stats and tasks exist.

## App scaffold

- Expo (current SDK at build time) with **Expo Router** (file based routes)
- **tRPC client + TanStack Query**, typed end to end from `@habit/api`'s router type
- **NativeWind** for styling, design tokens in `tailwind.config`
- **Reanimated** for animations, **react-native-svg** for the creature
- Token storage: `expo-secure-store` on native, `localStorage` on web, behind one `tokenStorage` interface
- `EXPO_PUBLIC_API_URL` env for the API base

### Route structure

```
app/
  (auth)/
    login.tsx
    register.tsx
  (main)/                # tab navigator, guarded by auth
    index.tsx            # Home (creature + today)
    habits/
      index.tsx          # manage habits
      new.tsx
      [id].tsx           # edit
    stats.tsx            # Phase 5
    tasks.tsx            # Phase 6
  _layout.tsx            # providers: tRPC, Query, theme; auth gate
```

### Source layout

```
src/
  components/            # reusable UI (Button, Card, Checkbox, XpBar, StreakFlame)
  creature/              # Creature.tsx + stage svgs + mood animations
  features/              # screen level components grouped by domain
  lib/                   # trpc client, tokenStorage, dates (today() in user tz)
  theme/                 # colors, spacing, typography tokens
```

## Design language (playful)

- **Palette:** warm cream background `#FFF8F0`, ink `#3D3A4B`, violet primary `#7C6FF0`, mint `#5ED5A8`, coral `#FF8A7A`, sunshine `#FFD66B`. Dark mode deferred to Phase 7.
- **Shapes:** big radii (16–24), soft shadows, chunky touch targets (min 48px).
- **Type:** rounded friendly font (e.g. Nunito via expo-font), bold weights for numbers.
- **Motion:** springs not linear easings; everything that changes value animates (XP bar fills, numbers count up, checkboxes pop).
- Habit `color` tokens map to this palette (the API stores the token name).

## Home screen spec

Layout, top to bottom:

1. **Creature stage area** (~40% height): the companion on a soft pastel hill, sized by stage, animated by mood. Level badge + animated XP progress bar beneath it. Tap creature → happy wiggle + heart (no mechanic, pure delight).
2. **Today header:** "Today" + `n of m done` + perfect day indicator once all are checked.
3. **Today's habit list:** card per habit scheduled today (daily scheduled today + weekly with remaining target). Emoji, name, streak flame with count, big round checkbox. Weekly habits show `2/4 this week` pill.

### Check off interaction (the core loop, must feel excellent)

1. Tap → checkbox pops (spring scale), card settles into "done" tint **immediately** (optimistic via TanStack `onMutate`).
2. Floating `+12 XP` particle drifts up from the checkbox.
3. Creature reacts: small hop, hearts on perfect day.
4. XP bar animates; on level up: full screen confetti + "Level 7!" card; if stage changed: evolution moment (glow → new form pops out) — full art in Phase 7, simple version now.
5. Server response reconciles state; on error, roll back with a gentle shake + toast.
6. Tapping a done habit uncompletes (undo mistakes), reversing XP optimistically.

`completions.toggle` already returns streak, xp, level info, creature state and perfectDay, so all celebration decisions come from one response, no refetch needed.

## Creature rendering (v1)

One SVG blob character with stage variants: **egg** (cracks appear near level 3), **hatchling** (blob + eyes), **sprout** (leaf on head), **juvenile** (arms), **adult** (bigger + accessory), **mythic** (glow + floating). Moods map to eyes/mouth/posture + idle animation speed: thriving = bouncy sparkle, happy = gentle bob, okay = neutral slow bob, sad = droopy eyes, sleeping = closed eyes + zzz. Reanimated loops drive idle motion. Art is deliberately simple and replaceable; the component contract is `creature/Creature.tsx` taking `{ stage, mood, size }`.

## Habits management screens

List with streak + completion info, archive via long press or edit screen. Create/edit form: name, emoji picker (curated grid, ~60 emojis), color token picker, type toggle (daily ↔ weekly), weekday chips (daily) or target stepper (weekly), base XP stepper (10 default, 5–30). Archive keeps history; archived section collapsed at bottom of list.

## Auth screens

Minimal and warm: app name + creature egg illustration, email, password, one button. Register asks display name and creature name ("Name your companion" — the hook of the onboarding). Token persisted; auth gate in `_layout` redirects.

## Implementation notes (2026-06-11)

Decisions made at build time, in spec order of importance:

- **Expo SDK 55** (expo 55.0.26, RN 0.83.6, React 19.2.0, Reanimated 4.2.1 +
  react-native-worklets 0.7.4, expo-router ~55.0.16, NativeWind 4.2.5 +
  Tailwind 3.4.19), not SDK 56. Rationale: Expo Go for SDK 56 is not on the
  iOS App Store (TestFlight/dev-build only, Xcode 26.4 required), NativeWind
  has no documented SDK 56 support (v5 is pre-release), and SDK 56 is where
  Expo Router forked off react-navigation (3 weeks old). Upgrade lands in
  Phase 7 (`npx expo install expo@^56 --fix` + router codemod).
- **`@habit/api` gained an `exports` field** pointing at `src/trpc/router.ts`
  so `import type { AppRouter }` resolves. Type-only import — no server code
  is bundled.
- **tRPC integration** is `@trpc/tanstack-react-query` (the current
  recommended client), not the classic `@trpc/react-query`.
- **Optimistic loop split**: onMutate flips `completedToday`/streak/weekCount
  in the habits cache (instant checkbox/tint); the `+XP` particle amount comes
  from core's `completionXp` with the listed streak (engine output, not UI
  math); XP bar, level, evolution, perfect day all reconcile from the toggle
  response in onSuccess; onError restores both caches, shakes the card,
  toasts.
- **Perfect day indicator** on Home is derived from daily habits only
  (mirrors core's `isPerfectDay` semantics); the server payload triggers the
  hearts celebration.
- **Metro shims**: workspace packages are TS source with Node ESM `.js`
  specifiers — a resolveRequest wrapper retries those without the extension.
  `react-native-css-interop` is a direct dependency (pnpm isolated
  node_modules can't reach nativewind's transitive dep from app code).
- **ESLint**: root config gained an override allowing `require()` in
  `apps/app/*.config.js` (Metro/Tailwind/Babel configs must be CJS).
- Tab icons are emoji (no icon library added); sign out lives in the Home
  header; register sends the device IANA timezone.

## Acceptance criteria

- [ ] Runs on iOS simulator and web (`pnpm --filter @habit/app dev`, then `i` / `w`)
- [ ] Register → name creature → land on home with egg
- [ ] Check off updates UI in <16ms perceived (optimistic), XP bar animates, creature reacts
- [ ] Level up celebration fires at the right moment (verify against core's curve)
- [ ] Toggle off reverses XP and streak display correctly
- [ ] Kill app → reopen → still logged in, state correct
- [ ] Airplane mode toggle → rollback + friendly error toast
