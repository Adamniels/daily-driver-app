/**
 * The "don't forget" space (docs/phase-6-tasks-reminders.md): quick add
 * pinned on top, open list newest first, done pile collapsed at the
 * bottom. Optimistic everywhere; notifications are scheduled/cancelled
 * around the server mutations, with the server's remind_at as truth.
 */
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { XpParticle } from '@/features/home/XpParticle';
import { confirmAsync } from '@/lib/confirm';
import { cancelTaskReminder, scheduleTaskReminder, toDate } from '@/lib/notifications';
import { useTRPC } from '@/lib/trpc';
import { palette } from '@/theme/colors';
import { EditTaskSheet } from './EditTaskSheet';
import type { TaskEdit } from './EditTaskSheet';
import { DoneTaskRow, OpenTaskRow } from './TaskRow';
import type { TaskItem, TasksList } from './types';

export function TasksScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const toast = useToast();
  const tasksKey = trpc.tasks.list.queryKey();
  const listQuery = useQuery(trpc.tasks.list.queryOptions());

  const [quickTitle, setQuickTitle] = useState('');
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  const particleKey = useRef(0);
  const quickInput = useRef<TextInput>(null);

  const setList = (fn: (list: TasksList) => TasksList) =>
    queryClient.setQueryData(tasksKey, (old) => (old ? fn(old) : old));

  const invalidateXp = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.creature.get.queryKey() });
    void queryClient.invalidateQueries({ queryKey: trpc.stats.pathKey() });
  };

  const spawnParticle = () => {
    particleKey.current += 1;
    const key = particleKey.current;
    setParticles((p) => [...p, key]);
    setTimeout(() => setParticles((p) => p.filter((k) => k !== key)), 1000);
  };

  const create = useMutation(
    trpc.tasks.create.mutationOptions({
      onSuccess: (created) => setList((l) => ({ ...l, open: [created, ...l.open] })),
      onError: () => toast.show("Couldn't add the task — try again."),
    }),
  );

  const complete = useMutation(
    trpc.tasks.complete.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: tasksKey });
        const prev = queryClient.getQueryData(tasksKey);
        setList((l) => {
          const task = l.open.find((t) => t.id === input.id);
          if (!task) return l;
          return {
            open: l.open.filter((t) => t.id !== input.id),
            recentlyDone: [
              { ...task, completedAt: new Date().toISOString() },
              ...l.recentlyDone,
            ].slice(0, 20),
          };
        });
        spawnParticle();
        return { prev };
      },
      onSuccess: (data) => {
        void cancelTaskReminder(data.task?.id ?? '');
        invalidateXp();
      },
      onError: (_e, _input, ctx) => {
        if (ctx?.prev) queryClient.setQueryData(tasksKey, ctx.prev);
        toast.show("Couldn't save that — check your connection.");
      },
    }),
  );

  const uncomplete = useMutation(
    trpc.tasks.uncomplete.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: tasksKey });
        const prev = queryClient.getQueryData(tasksKey);
        setList((l) => {
          const task = l.recentlyDone.find((t) => t.id === input.id);
          if (!task) return l;
          return {
            open: [{ ...task, completedAt: null }, ...l.open],
            recentlyDone: l.recentlyDone.filter((t) => t.id !== input.id),
          };
        });
        return { prev };
      },
      onSuccess: (data) => {
        invalidateXp();
        // A restored task with a future reminder starts firing again.
        const task = data.task;
        if (task?.remindAt) {
          const when = toDate(task.remindAt);
          if (when.getTime() > Date.now()) void scheduleTaskReminder(task.id, task.title, when);
        }
      },
      onError: (_e, _input, ctx) => {
        if (ctx?.prev) queryClient.setQueryData(tasksKey, ctx.prev);
        toast.show("Couldn't save that — check your connection.");
      },
    }),
  );

  const remove = useMutation(
    trpc.tasks.delete.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: tasksKey });
        const prev = queryClient.getQueryData(tasksKey);
        setList((l) => ({
          open: l.open.filter((t) => t.id !== input.id),
          recentlyDone: l.recentlyDone.filter((t) => t.id !== input.id),
        }));
        return { prev };
      },
      onSuccess: (data) => {
        void cancelTaskReminder(data.deletedId);
        invalidateXp();
      },
      onError: (_e, _input, ctx) => {
        if (ctx?.prev) queryClient.setQueryData(tasksKey, ctx.prev);
        toast.show("Couldn't delete — try again.");
      },
    }),
  );

  const update = useMutation(
    trpc.tasks.update.mutationOptions({
      onSuccess: (updated) => {
        if (!updated) return;
        setList((l) => ({
          ...l,
          open: l.open.map((t) => (t.id === updated.id ? updated : t)),
        }));
        if (updated.remindAt) {
          const when = toDate(updated.remindAt);
          void scheduleTaskReminder(updated.id, updated.title, when);
        } else {
          void cancelTaskReminder(updated.id);
        }
        setEditing(null);
      },
      onError: () => toast.show("Couldn't save changes."),
    }),
  );

  const quickAdd = () => {
    const title = quickTitle.trim();
    if (!title) return;
    setQuickTitle('');
    quickInput.current?.focus();
    create.mutate({ title });
  };

  const deleteTask = (task: TaskItem) => {
    void (async () => {
      // Confirm only when notes would be lost — frictionless otherwise.
      if (task.notes) {
        const ok = await confirmAsync('Delete task?', 'It has notes — they go with it.');
        if (!ok) return;
      }
      setEditing(null);
      remove.mutate({ id: task.id });
    })();
  };

  const saveEdit = (task: TaskItem, edit: TaskEdit) => {
    update.mutate({
      id: task.id,
      title: edit.title,
      notes: edit.notes,
      remindAt: edit.remindAt === null ? null : edit.remindAt.toISOString(),
    });
  };

  const list = listQuery.data;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 pb-3 pt-2">
          <Text className="font-sans-black text-2xl text-ink">Tasks</Text>
          {particles.map((key) => (
            <View key={key} className="absolute right-10 top-8">
              <XpParticle amount={5} seed={key} />
            </View>
          ))}
        </View>

        {/* Quick add: type, return, done. Zero friction is the point. */}
        <View className="px-6 pb-3">
          <TextInput
            ref={quickInput}
            value={quickTitle}
            onChangeText={setQuickTitle}
            onSubmitEditing={quickAdd}
            placeholder="Add something to remember…"
            placeholderTextColor={palette.inkSoft}
            returnKeyType="done"
            submitBehavior="submit"
            className="min-h-12 rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 font-sans text-base text-ink focus:border-violet"
          />
        </View>

        {listQuery.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette.violet} size="large" />
          </View>
        ) : list ? (
          <ScrollView contentContainerClassName="gap-3 px-6 pb-10" keyboardShouldPersistTaps="handled">
            {list.open.length === 0 && (
              <View className="items-center gap-1 rounded-card bg-white p-8">
                <Text className="font-sans-bold text-base text-ink">All clear.</Text>
                <Text className="text-center font-sans text-sm text-ink/50">
                  Anything on your mind? Park it here and forget it guilt free.
                </Text>
              </View>
            )}
            {list.open.map((task) => (
              <OpenTaskRow
                key={task.id}
                task={task}
                onComplete={() => complete.mutate({ id: task.id })}
                onDelete={() => deleteTask(task)}
                onEdit={() => setEditing(task)}
              />
            ))}

            {list.recentlyDone.length > 0 && (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowDone((s) => !s)}
                  className="mt-4 px-1"
                >
                  <Text className="font-sans-bold text-sm text-ink/50">
                    {showDone ? '▾' : '▸'} Done ({list.recentlyDone.length})
                  </Text>
                </Pressable>
                {showDone &&
                  list.recentlyDone.map((task) => (
                    <DoneTaskRow
                      key={task.id}
                      task={task}
                      onUncomplete={() => uncomplete.mutate({ id: task.id })}
                    />
                  ))}
              </>
            )}
          </ScrollView>
        ) : null}
      </KeyboardAvoidingView>

      {editing && (
        <EditTaskSheet
          task={editing}
          busy={update.isPending || remove.isPending}
          onSave={(edit) => saveEdit(editing, edit)}
          onDelete={() => deleteTask(editing)}
          onClose={() => setEditing(null)}
        />
      )}
    </SafeAreaView>
  );
}
