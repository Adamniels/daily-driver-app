import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { useTRPC } from '@/lib/trpc';
import { DEFAULT_VALUES, HabitForm } from './HabitForm';
import type { HabitFormValues } from './HabitForm';

export function NewHabitScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const toast = useToast();

  const create = useMutation(
    trpc.habits.create.mutationOptions({
      onSuccess: async (created) => {
        await queryClient.invalidateQueries({ queryKey: trpc.habits.list.pathKey() });
        toast.show(`${created.emoji} ${created.name} created!`, 'success');
        router.back();
      },
      onError: (error) => toast.show(error.message || "Couldn't create the habit."),
    }),
  );

  const submit = (values: HabitFormValues) => {
    if (values.type === 'daily') {
      create.mutate({
        type: 'daily',
        name: values.name,
        emoji: values.emoji,
        color: values.color,
        baseXp: values.baseXp,
        scheduledDays: values.scheduledDays,
      });
    } else {
      create.mutate({
        type: 'weekly',
        name: values.name,
        emoji: values.emoji,
        color: values.color,
        baseXp: values.baseXp,
        targetPerWeek: values.targetPerWeek,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-row items-center gap-3 px-6 pb-3 pt-2">
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
          <Text className="font-sans-black text-2xl text-ink/40">‹</Text>
        </Pressable>
        <Text className="font-sans-black text-2xl text-ink">New habit</Text>
      </View>
      <HabitForm initial={DEFAULT_VALUES} mode="create" busy={create.isPending} onSubmit={submit} />
    </SafeAreaView>
  );
}
