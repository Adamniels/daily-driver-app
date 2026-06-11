/**
 * Local notification reminders for tasks (docs/phase-6-tasks-reminders.md).
 *
 * No local id store: every scheduled notification carries its taskId in
 * `content.data`, so cancel/reconcile work by scanning the OS schedule.
 * The server's remind_at is the source of truth — `reconcileReminders`
 * wipes and reschedules from server data on app start, which makes
 * reminders survive reinstalls and device switches for free.
 *
 * Web: expo-notifications has no web support — every function is a no-op
 * and the UI shows a "reminders fire on your phone" hint instead.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const notificationsSupported = Platform.OS !== 'web';

const BODY = 'you wanted to remember this';
const ANDROID_CHANNEL = 'reminders';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const status = await Notifications.getPermissionsAsync();
  return status.granted;
}

/** Ask only when the user actually sets a reminder — never at launch. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (await hasNotificationPermission()) return true;
  const status = await Notifications.requestPermissionsAsync();
  return status.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function taskIdOf(notification: Notifications.NotificationRequest): string | null {
  const data: unknown = notification.content.data;
  if (data && typeof data === 'object' && 'taskId' in data) {
    const id = data.taskId;
    if (typeof id === 'string') return id;
  }
  return null;
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  if (!notificationsSupported) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => taskIdOf(n) === taskId)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  when: Date,
): Promise<void> {
  if (!notificationsSupported) return;
  await cancelTaskReminder(taskId);
  if (when.getTime() <= Date.now()) return;
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body: BODY, data: { taskId, url: '/tasks' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL } : {}),
    },
  });
}

export interface ReminderTask {
  id: string;
  title: string;
  remindAt: Date | string | null;
  completedAt: Date | string | null;
}

/** tRPC (no transformer) serializes Dates to ISO strings; accept both. */
export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Wipe every task notification, then schedule from server truth: open
 * tasks with a future remind_at. Runs on app start (and after task list
 * refetches); skips silently without permission so it never prompts.
 */
export async function reconcileReminders(tasks: readonly ReminderTask[]): Promise<void> {
  if (!notificationsSupported) return;
  if (!(await hasNotificationPermission())) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => taskIdOf(n) !== null)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const now = Date.now();
  await Promise.all(
    tasks
      .filter((t) => t.completedAt === null && t.remindAt !== null)
      .filter((t) => toDate(t.remindAt as Date | string).getTime() > now)
      .map((t) => scheduleTaskReminder(t.id, t.title, toDate(t.remindAt as Date | string))),
  );
}
