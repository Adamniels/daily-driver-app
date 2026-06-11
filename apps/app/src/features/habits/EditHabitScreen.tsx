import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Weekday } from '@habit/core';
import type { ColorToken } from '@habit/shared';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { confirmAsync } from '@/lib/confirm';
import { useTRPC } from '@/lib/trpc';
import { HabitForm } from './HabitForm';
import type { HabitFormValues } from './HabitForm';

export function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const toast = useToast();

  const habitsQuery = useQuery(trpc.habits.list.queryOptions({ includeArchived: true }));
  const habit = habitsQuery.data?.find((h) => h.id === id);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.habits.list.pathKey() });

  const update = useMutation(
    trpc.habits.update.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.show('Saved!', 'success');
        router.back();
      },
      onError: (error) => toast.show(error.message || "Couldn't save changes."),
    }),
  );
  const archive = useMutation(
    trpc.habits.archive.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.show('Archived — history kept.', 'success');
        router.back();
      },
      onError: () => toast.show("Couldn't archive — try again."),
    }),
  );
  const unarchive = useMutation(
    trpc.habits.unarchive.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.show('Restored!', 'success');
      },
      onError: () => toast.show("Couldn't restore — try again."),
    }),
  );

  if (habitsQuery.isPending || !habit) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cream">
        {habitsQuery.isPending ? (
          <ActivityIndicator color="#7C6FF0" size="large" />
        ) : (
          <Text className="font-sans-bold text-base text-ink">Habit not found.</Text>
        )}
      </SafeAreaView>
    );
  }

  const initial: HabitFormValues = {
    name: habit.name,
    emoji: habit.emoji,
    color: habit.color as ColorToken,
    type: habit.type,
    scheduledDays: habit.scheduledDays as Weekday[] | null,
    targetPerWeek: habit.targetPerWeek ?? 3,
    baseXp: habit.baseXp,
  };

  const submit = (values: HabitFormValues) => {
    update.mutate({
      id: habit.id,
      name: values.name,
      emoji: values.emoji,
      color: values.color,
      baseXp: values.baseXp,
      ...(habit.type === 'daily'
        ? { scheduledDays: values.scheduledDays }
        : { targetPerWeek: values.targetPerWeek }),
    });
  };

  const archived = habit.archivedOn !== null;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-row items-center gap-3 px-6 pb-3 pt-2">
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
          <Text className="font-sans-black text-2xl text-ink/40">‹</Text>
        </Pressable>
        <Text className="flex-1 font-sans-black text-2xl text-ink" numberOfLines={1}>
          Edit {habit.name}
        </Text>
      </View>
      <HabitForm
        initial={initial}
        mode="edit"
        busy={update.isPending}
        onSubmit={submit}
        footer={
          archived ? (
            <Button label="Restore habit" variant="secondary" onPress={() => unarchive.mutate({ id: habit.id })} />
          ) : (
            <Button
              label="Archive habit"
              variant="danger"
              onPress={() => {
                void (async () => {
                  const ok = await confirmAsync(
                    'Archive habit?',
                    'History is kept and it can be restored any time.',
                  );
                  if (ok) archive.mutate({ id: habit.id });
                })();
              }}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
