# Habit Quest — Build Plan

A personal, gamified habit tracker. One Expo codebase for iOS and web, a TypeScript API on Postgres, and a pure domain package holding the gamification engine.

## 1. Decisions made

| Area | Decision |
|---|---|
| Frontend | Expo (React Native + TypeScript), ships to iOS, Android and web from one codebase |
| Backend | TypeScript API with tRPC, end to end type safety into the app |
| Database | Postgres from day 1 (Docker locally, Neon/Supabase free tier when deployed) |
| Offline | Online only for v1, optimistic UI so it feels instant |
| Purpose | Daily tool first, clean architecture but lean scope |
| Gamification | XP, levels, stats, streaks with multipliers, evolving tamagotchi creature |
| Style | Playful, colorful, celebratory animations |

## 2. Monorepo structure

```
habit-tracker-app/
  apps/
    app/                  # Expo: screens, navigation, components
    api/                  # tRPC server (Hono), auth, Drizzle ORM
  packages/
    core/                 # Pure domain logic, zero dependencies, fully unit tested
    shared/               # Zod schemas + types shared by api and app
  docker-compose.yml      # Local Postgres
  turbo.json / pnpm-workspace.yaml
```

Why this shape: `core` holds every gamification rule (XP, streaks, levels, creature state) as pure functions. The API and the app both consume it, so the rules are testable in isolation and portable if the stack ever changes. tRPC means the app imports the API's router type, so any contract break is a compile error.

## 3. Tech choices

- **API**: Hono + tRPC v11, Drizzle ORM, Zod validation, argon2 password hashing, JWT sessions. Single user in practice, but the schema is multi user ready (every table has user_id).
- **App**: Expo Router, TanStack Query + tRPC client with optimistic updates, NativeWind (Tailwind) for styling, Reanimated for the fun animations, expo-notifications for local reminders, react-native-svg for the creature.
- **Quality**: TypeScript strict everywhere, Vitest for core and api, ESLint + Prettier, git from the first commit.

## 4. Data model

```
users               id, email, password_hash, display_name, created_at
habits              id, user_id, name, emoji, color,
                    type: 'daily' | 'weekly',        -- weekly = X times per week
                    target_per_week (weekly only),
                    scheduled_days (daily, optional subset like Mon–Fri),
                    base_xp, created_at, archived_at
habit_completions   id, habit_id, user_id, date, completed_at
xp_events           id, user_id, amount, source ('habit' | 'task' | 'perfect_day'),
                    source_id, date, created_at     -- append only XP ledger
tasks               id, user_id, title, notes, remind_at (nullable),
                    completed_at, created_at        -- the backlog/reminder items
creature            user_id, name, hatched_at       -- everything else is derived
```

Total XP, level, streaks, creature stage and mood are all **derived** by `core` from completions and the XP ledger. Nothing gamification critical is stored redundantly, so there is no cache invalidation problem. If queries get slow later, we add cached columns then.

## 5. Gamification rules (v1)

**XP and levels**
- Each habit completion awards `base_xp × streak multiplier` (base 10 by default, adjustable per habit).
- Completing a task awards a small fixed XP (5).
- Perfect day bonus: finishing every habit scheduled for that day awards +20.
- Level curve: XP to go from level n to n+1 is `100 × n^1.3`, rounded. Early levels come fast, later ones take commitment.

**Streaks**
- Each habit has its own streak. Daily habits count consecutive scheduled days; weekly habits count consecutive weeks hitting the target.
- Multiplier: `1 + 0.05 × min(streak, 10)`, so it ramps to 1.5× at a 10 day streak and caps there. Missing a scheduled day resets that habit's streak.

**Creature**
- One companion. It hatches when you create your account.
- **Evolution is permanent** and driven by level: Egg (1) → Hatchling (3) → Sprout (7) → Juvenile (12) → Adult (20) → Mythic (30). It never devolves; your progress is yours.
- **Mood is daily** and driven by your last 7 days' completion rate: thriving (≥80%), happy (≥60%), okay (≥40%), sad (≥20%), sleeping (<20%). Lapse and it gets visibly sad and sleepy, come back and it perks up. No permadeath, guilt is a bad long term motivator.
- The creature is the home screen: it reacts when you check off habits (bounce, hearts, confetti on level up).

## 6. Screens (v1)

1. **Home / Creature** — the companion, its mood, level + XP bar, today's habits as a quick checklist with satisfying check animations.
2. **Habits** — manage habits, see per habit streak flames, create/edit/archive.
3. **Stats** — GitHub style yearly heatmap, current and best streaks, XP over time chart, per habit completion rates.
4. **Tasks** — the someday/backlog list (set up tmux, fix nvim config), optional reminder date that fires a local notification, completing gives a little XP.
5. **Login** — minimal email + password.

## 7. Build order

1. **Scaffold**: monorepo, tooling, docker-compose Postgres, CI ready lint/test scripts.
2. **`packages/core`**: full gamification engine with unit tests (XP, levels, streaks for daily and weekly, creature stage and mood, perfect day logic). This is written first and tested before any UI exists.
3. **`apps/api`**: Drizzle schema + migrations, auth, tRPC routers (habits, completions, tasks, stats, creature), integration smoke tests.
4. **`apps/app`**: auth flow, home screen with creature + today list + optimistic check off, habits management.
5. **Stats screen** (heatmap, charts) and **Tasks screen** (+ local notifications).
6. **Polish**: level up celebration, evolution animation, empty states, app icon, README with run instructions.
7. **Later, together**: deploy API + Postgres (Neon + Fly/Railway), EAS build for installing on your iPhone, web deploy. Offline queue only if online only ever annoys you.

## 8. Out of scope for v1 (deliberately)

Social features, multiple creatures, shop/cosmetics, push notifications from server (local notifications cover reminders), Android polish (it will run, just not the focus), offline sync engine.
