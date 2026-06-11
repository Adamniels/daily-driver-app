/**
 * Manage habits: active list with streaks, archived section collapsed at
 * the bottom. Tap a row to edit, long press to archive (archive keeps
 * history — never deletes).
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColorToken } from '@habit/shared';
import { Skeleton } from '@/components/Skeleton';
import { StreakFlame } from '@/components/StreakFlame';
import { useToast } from '@/components/Toast';
import { confirmAsync } from '@/lib/confirm';
import { useTRPC } from '@/lib/trpc';
import type { HabitRow } from '@/lib/trpc';
import { habitColors } from '@/theme/colors';

function HabitListRow({ habit, archived }: { habit: HabitRow; archived: boolean }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const toast = useToast();
  const colors = habitColors[habit.color as ColorToken] ?? habitColors.violet;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.habits.list.pathKey() });

  const archive = useMutation(
    trpc.habits.archive.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.show(`${habit.name} archived`, 'success');
      },
      onError: () => toast.show("Couldn't archive — try again."),
    }),
  );
  const unarchive = useMutation(
    trpc.habits.unarchive.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.show("Couldn't restore — try again."),
    }),
  );

  const onLongPress = () => {
    void (async () => {
      if (archived) return;
      const ok = await confirmAsync('Archive habit?', `"${habit.name}" keeps its history and can be restored.`);
      if (ok) archive.mutate({ id: habit.id });
    })();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/habits/[id]', params: { id: habit.id } })}
      onLongPress={onLongPress}
      className={`flex-row items-center gap-3 rounded-card bg-white p-4 shadow-sm shadow-ink/10 ${
        archived ? 'opacity-60' : ''
      }`}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: colors.soft }}
      >
        <Text className="text-2xl">{habit.emoji}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-sans-bold text-base text-ink" numberOfLines={1}>
          {habit.name}
        </Text>
        <View className="flex-row items-center gap-2">
          {!archived && <StreakFlame streak={habit.currentStreak} />}
          <Text className="font-sans text-xs text-ink/50">
            best {habit.bestStreak}
            {habit.type === 'weekly' && habit.targetPerWeek !== null
              ? ` · ${habit.weekCount ?? 0}/${habit.targetPerWeek} this week`
              : ''}
          </Text>
        </View>
      </View>
      {archived ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => unarchive.mutate({ id: habit.id })}
          className="rounded-xl bg-mint-soft px-3 py-2"
          hitSlop={6}
        >
          <Text className="font-sans-bold text-xs text-ink/70">restore</Text>
        </Pressable>
      ) : (
        <Text className="font-sans-black text-lg text-ink/20">›</Text>
      )}
    </Pressable>
  );
}

export function HabitsScreen() {
  const trpc = useTRPC();
  const habitsQuery = useQuery(trpc.habits.list.queryOptions({ includeArchived: true }));
  const [showArchived, setShowArchived] = useState(false);

  const { active, archived } = useMemo(() => {
    const rows = habitsQuery.data ?? [];
    return {
      active: rows.filter((h) => h.archivedOn === null),
      archived: rows.filter((h) => h.archivedOn !== null),
    };
  }, [habitsQuery.data]);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 pb-3 pt-2">
        <Text className="font-sans-black text-2xl text-ink">Habits</Text>
        <Link href="/habits/new" asChild>
          <Pressable accessibilityRole="link" className="rounded-bubble bg-violet px-4 py-2.5">
            <Text className="font-sans-bold text-white">+ New</Text>
          </Pressable>
        </Link>
      </View>

      {habitsQuery.isPending ? (
        <View className="gap-3 px-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-3 px-6 pb-10">
          {active.length === 0 && (
            <View className="items-center gap-2 rounded-card bg-white p-8">
              <Text className="font-sans-bold text-base text-ink">No habits yet.</Text>
              <Text className="text-center font-sans text-sm text-ink/60">
                Start small — one tiny daily habit beats five ambitious ones.
              </Text>
            </View>
          )}
          {active.map((habit) => (
            <HabitListRow key={habit.id} habit={habit} archived={false} />
          ))}

          {archived.length > 0 && (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowArchived((s) => !s)}
                className="mt-4 flex-row items-center gap-2 px-1"
              >
                <Text className="font-sans-bold text-sm text-ink/50">
                  {showArchived ? '▾' : '▸'} Archived ({archived.length})
                </Text>
              </Pressable>
              {showArchived &&
                archived.map((habit) => <HabitListRow key={habit.id} habit={habit} archived />)}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
