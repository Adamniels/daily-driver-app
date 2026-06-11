# Phase 6 — Tasks + Reminders

**Status:** Not started
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

## Acceptance criteria

- [ ] Add task in under 2 seconds from opening the screen
- [ ] Reminder fires at the set time on iOS (device or simulator), tap opens tasks screen
- [ ] Editing a reminder time reschedules (old notification never fires)
- [ ] Completing/deleting a task cancels its pending notification
- [ ] Reinstall test: notifications restored from server data on first launch
- [ ] Complete → +5 XP in ledger; uncomplete → ledger clean
- [ ] Web: full CRUD works, reminder hint shown, nothing crashes
