# Phase 6 — Tasks + Reminders

**Status:** Done (2026-06-11) — review passed
**Depends on:** Phase 4
**Blocks:** nothing

## Goal

The "don't forget" space: one off items like *set up tmux* or *fix nvim config*, and intentions like *improve my sleep*. Not a project manager. No projects, no priorities, no due date pressure, just a trustworthy list with optional reminders, and a little XP for clearing things.

## Screen spec

- **Open list:** clean rows — title, optional notes preview, bell icon + date if a reminder is set. Newest first. Swipe right to complete (satisfying sweep + `+5 XP` particle), swipe left to delete (confirm only if it has notes). Tap to edit.
- **Quick add:** input pinned at top, type → enter → added. Zero friction is the whole point; details (notes, reminder) can be added later via edit.
- **Edit sheet:** title, notes (multiline), reminder toggle → date + time picker. Clearing the toggle cancels the notification.
- **Done section:** collapsed at bottom, last 20 completed with relative time, tap to uncomplete (reverses XP). Keeps the satisfaction of a visible "done" pile without clutter.

## Reminders (local notifications)

- `expo-notifications`, fully client side — no server push infrastructure in v1.
- Permission requested the **first time a reminder is set**, never at app launch. Denied → friendly inline note that reminders need notification access, with a settings link.
- On schedule: store the OS notification id locally (keyed by task id) so edit/delete/complete can cancel and reschedule precisely.
- Notification: title = task title, body = "you wanted to remember this 🌱", tap → deep link to tasks screen.
- **Reconciliation on app start:** reschedule notifications for open tasks with future `remind_at`, cancel any orphans. The server's `remind_at` is the source of truth; OS state is a cache. This makes reminders survive reinstalls and device switches for free.
- **Web fallback:** no local notifications on web in v1. Reminder UI works (data is saved), with a subtle "reminders fire on your phone" hint. Documented limitation, not a bug.

## XP integration

Completing a task awards `TASK_XP` (5) via the ledger (`tasks.complete`), uncompleting reverses it. Tasks deliberately do not affect streaks, mood or perfect days — those measure consistency, and a backlog purge should not inflate them. The creature still does a small hop on task completion (visual fun without mechanical weight).

## Implementation notes (2026-06-11)

- **No local notification-id store**: every scheduled notification carries
  its taskId in `content.data`, so cancel works by scanning
  `getAllScheduledNotificationsAsync`. Reconciliation (in the signed-in
  layout, on tasks data load) wipes all task notifications and reschedules
  from server `remind_at` — simpler and strictly more robust than diffing.
- **Complete works by tap too**: the row's circle completes on every
  platform; swipe right/left (complete/delete) is the native fast path.
  Swipe-to-complete on web is unreliable with mouse input, so the circle
  is the cross platform guarantee.
- **Date picker**: iOS uses the system compact pickers inline; Android
  opens system dialogs (tap = date, long press = time; Android polish is
  out of scope per PLAN). Web falls back to a parsed "YYYY-MM-DD HH:mm"
  text input with the "reminders fire on your phone" hint.
- **Permission denied UX**: the reminder still saves (server data is
  truth); an inline coral note links to system Settings.
- Notification body is "you wanted to remember this" — the spec's 🌱
  dropped per the no-emoji rule (Adam, phase 4 review).
- Notification taps deep link to /tasks via a response listener +
  `getLastNotificationResponseAsync` for cold starts.
- **Expo Go caveat**: iOS local notifications work in Expo Go for
  scheduling/firing, but behavior is more faithful in a dev build; the
  reinstall-reconciliation criterion is best verified there.

## Acceptance criteria

- [ ] Add task in under 2 seconds from opening the screen
- [ ] Reminder fires at the set time on iOS (device or simulator), tap opens tasks screen
- [ ] Editing a reminder time reschedules (old notification never fires)
- [x] Completing/deleting a task cancels its pending notification
- [ ] Reinstall test: notifications restored from server data on first launch
- [x] Complete → +5 XP in ledger; uncomplete → ledger clean
- [x] Web: full CRUD works, reminder hint shown, nothing crashes
