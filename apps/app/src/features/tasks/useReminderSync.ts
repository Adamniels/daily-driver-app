/**
 * Mounted in the signed-in layout: reconciles OS notifications with server
 * data on app start, and deep links notification taps to the tasks tab.
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQuery } from '@tanstack/react-query';
import { notificationsSupported, reconcileReminders } from '@/lib/notifications';
import { useTRPC } from '@/lib/trpc';

export function useReminderSync(): void {
  const trpc = useTRPC();
  const router = useRouter();
  const tasksQuery = useQuery(trpc.tasks.list.queryOptions());

  useEffect(() => {
    if (!tasksQuery.data) return;
    void reconcileReminders([...tasksQuery.data.open, ...tasksQuery.data.recentlyDone]);
  }, [tasksQuery.data]);

  useEffect(() => {
    if (!notificationsSupported) return;
    const goToTasks = () => router.push('/tasks');
    // Tap while running / backgrounded:
    const sub = Notifications.addNotificationResponseReceivedListener(goToTasks);
    // Tap that cold-started the app:
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) goToTasks();
    });
    return () => sub.remove();
  }, [router]);
}
