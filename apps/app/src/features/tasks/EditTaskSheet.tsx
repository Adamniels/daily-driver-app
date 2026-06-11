/**
 * Bottom sheet for editing a task: title, notes, reminder toggle with
 * date + time. Notification permission is requested here — the first
 * time a reminder is actually set, never at launch. Denied → inline note
 * with a settings link.
 */
import { useState } from 'react';
import { Linking, Modal, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import {
  ensureNotificationPermission,
  notificationsSupported,
  toDate,
} from '@/lib/notifications';
import { palette } from '@/theme/colors';
import { DateTimeField } from './DateTimeField';
import type { TaskItem } from './types';

export interface TaskEdit {
  title: string;
  notes: string | null;
  remindAt: Date | null;
}

interface EditTaskSheetProps {
  task: TaskItem;
  onSave: (edit: TaskEdit) => void;
  onDelete: () => void;
  onClose: () => void;
  busy: boolean;
}

/** Tomorrow 09:00 — a sane default the picker starts from. */
function defaultReminder(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function EditTaskSheet({ task, onSave, onDelete, onClose, busy }: EditTaskSheetProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [reminderOn, setReminderOn] = useState(task.remindAt !== null);
  const [when, setWhen] = useState<Date>(task.remindAt ? toDate(task.remindAt) : defaultReminder());
  const [permissionDenied, setPermissionDenied] = useState(false);

  const toggleReminder = (on: boolean) => {
    void (async () => {
      if (on && notificationsSupported) {
        const granted = await ensureNotificationPermission();
        setPermissionDenied(!granted);
        // Reminder data is still saved without permission; it just can't fire.
      }
      setReminderOn(on);
    })();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-ink/30" onPress={onClose} accessibilityLabel="Close" />
      <View className="gap-4 rounded-t-card bg-cream px-6 pb-10 pt-5">
        <View className="h-1.5 w-12 self-center rounded-full bg-ink/15" />

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor={palette.inkSoft}
          className="min-h-12 rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 font-sans-bold text-base text-ink"
        />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes (optional)"
          placeholderTextColor={palette.inkSoft}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="min-h-20 rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 font-sans text-base text-ink"
        />

        <View className="flex-row items-center justify-between">
          <Text className="font-sans-bold text-base text-ink">Reminder</Text>
          <Switch
            value={reminderOn}
            onValueChange={toggleReminder}
            trackColor={{ true: palette.violet, false: `${palette.ink}22` }}
            thumbColor="#FFFFFF"
          />
        </View>

        {reminderOn && (
          <>
            <DateTimeField value={when} onChange={setWhen} />
            {permissionDenied && (
              <Pressable accessibilityRole="link" onPress={() => void Linking.openSettings()}>
                <Text className="font-sans text-xs text-coral">
                  Notifications are off for this app — the reminder is saved but can't fire.
                  Tap to open Settings.
                </Text>
              </Pressable>
            )}
          </>
        )}

        <Button
          label={busy ? 'Saving…' : 'Save'}
          onPress={() =>
            onSave({
              title: title.trim(),
              notes: notes.trim() === '' ? null : notes.trim(),
              remindAt: reminderOn ? when : null,
            })
          }
          disabled={busy || title.trim().length === 0}
        />
        <Button label="Delete task" variant="danger" onPress={onDelete} disabled={busy} />
      </View>
    </Modal>
  );
}
