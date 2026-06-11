/**
 * Home: creature + today's checklist — the core loop.
 *
 * Optimistic flow (invariant 5): onMutate flips the habits cache so the
 * checkbox/tint react instantly; the +XP particle uses core's completionXp
 * (engine output, never UI math — invariant 1); the XP bar, level ups,
 * evolution and perfect day all come from the server's toggle payload in
 * onSuccess; onError restores both caches, shakes the card and toasts.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { completionXp, isScheduledOn } from '@habit/core';
import type { Stage, Weekday } from '@habit/core';
import { Button } from '@/components/Button';
import { SparkleIcon } from '@/components/icons';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { Creature } from '@/creature/Creature';
import { XpBar } from '@/components/XpBar';
import { useAuth } from '@/lib/auth';
import { todayLocal } from '@/lib/dates';
import { hapticHeavy, hapticSuccess, hapticTick } from '@/lib/haptics';
import { useTRPC } from '@/lib/trpc';
import type { HabitRow } from '@/lib/trpc';
import { CelebrationOverlay } from './CelebrationOverlay';
import { EvolutionOverlay } from './EvolutionOverlay';
import { RainbowShimmer } from './RainbowShimmer';
import { TodayHabitCard } from './TodayHabitCard';
import type { Particle } from './TodayHabitCard';

/** Narrow a DB row to the shape core's schedule helpers expect. */
function schedulable(habit: HabitRow): { type: 'daily' | 'weekly'; scheduledDays: readonly Weekday[] | null } {
  return {
    type: habit.type,
    scheduledDays: habit.scheduledDays as Weekday[] | null,
  };
}

type Celebration =
  | { kind: 'levelUp'; level: number }
  | { kind: 'evolution'; from: Stage; to: Stage };

export function HomeScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, signOut } = useAuth();
  const today = todayLocal();

  const habitsQuery = useQuery(trpc.habits.list.queryOptions({}));
  const creatureQuery = useQuery(trpc.creature.get.queryOptions());
  const habitsKey = trpc.habits.list.queryKey({});
  const creatureKey = trpc.creature.get.queryKey();

  const [particles, setParticles] = useState<Record<string, Particle[]>>({});
  const [shakeKeys, setShakeKeys] = useState<Record<string, number>>({});
  const [hopSignal, setHopSignal] = useState(0);
  const [heartsSignal, setHeartsSignal] = useState(0);
  const [shimmerKey, setShimmerKey] = useState(0);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const particleKey = useRef(0);

  const spawnParticle = useCallback((habitId: string, amount: number) => {
    particleKey.current += 1;
    const particle: Particle = { key: particleKey.current, amount };
    setParticles((current) => ({ ...current, [habitId]: [...(current[habitId] ?? []), particle] }));
    setTimeout(() => {
      setParticles((current) => ({
        ...current,
        [habitId]: (current[habitId] ?? []).filter((p) => p.key !== particle.key),
      }));
    }, 1000);
  }, []);

  const toggle = useMutation(
    trpc.completions.toggle.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: habitsKey });
        await queryClient.cancelQueries({ queryKey: creatureKey });
        const prevHabits = queryClient.getQueryData(habitsKey);
        const prevCreature = queryClient.getQueryData(creatureKey);

        queryClient.setQueryData(habitsKey, (old) =>
          old?.map((h) => {
            if (h.id !== input.habitId) return h;
            const completing = !h.completedToday;
            return {
              ...h,
              completedToday: completing,
              currentStreak: completing ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1),
              weekCount: h.weekCount === null ? null : Math.max(0, h.weekCount + (completing ? 1 : -1)),
            };
          }),
        );

        return { prevHabits, prevCreature };
      },
      onSuccess: (data, input, ctx) => {
        // Reconcile the toggled row with engine truth.
        queryClient.setQueryData(habitsKey, (old) =>
          old?.map((h) =>
            h.id === input.habitId
              ? {
                  ...h,
                  completedToday: data.completed,
                  currentStreak: data.habitStreak,
                  bestStreak: Math.max(h.bestStreak, data.habitStreak),
                }
              : h,
          ),
        );
        queryClient.setQueryData(creatureKey, (old) =>
          old ? { ...old, totalXp: data.totalXp, level: data.level, state: data.creature } : old,
        );
        // Other list variants (Habits tab) and stats refetch lazily.
        void queryClient.invalidateQueries({ queryKey: trpc.habits.list.queryKey({ includeArchived: true }) });
        void queryClient.invalidateQueries({ queryKey: trpc.stats.pathKey() });

        if (data.completed) {
          if (data.perfectDay) {
            setHeartsSignal((s) => s + 1);
            setShimmerKey((k) => k + 1);
          }
          const prevLevel = ctx?.prevCreature?.level.level;
          const prevStage = ctx?.prevCreature?.state.stage;
          // Evolution outranks level up: it is the rarer moment, and a
          // stage change always implies one.
          if (prevStage !== undefined && data.creature.stage !== prevStage) {
            hapticHeavy();
            setCelebration({ kind: 'evolution', from: prevStage, to: data.creature.stage });
          } else if (prevLevel !== undefined && data.level.level > prevLevel) {
            hapticSuccess();
            setHopSignal((s) => s + 1); // the creature jumps with you
            setCelebration({ kind: 'levelUp', level: data.level.level });
          }
        }
      },
      onError: (_error, input, ctx) => {
        if (ctx?.prevHabits) queryClient.setQueryData(habitsKey, ctx.prevHabits);
        if (ctx?.prevCreature) queryClient.setQueryData(creatureKey, ctx.prevCreature);
        setShakeKeys((current) => ({ ...current, [input.habitId]: (current[input.habitId] ?? 0) + 1 }));
        toast.show("Couldn't save that — check your connection.");
      },
    }),
  );

  const handleToggle = useCallback(
    (habit: HabitRow) => {
      if (!habit.completedToday) {
        // Optimistic celebration: engine-computed XP for the particle,
        // creature hop. Exact totals reconcile from the server response.
        hapticTick();
        spawnParticle(habit.id, completionXp({ baseXp: habit.baseXp }, habit.currentStreak));
        setHopSignal((s) => s + 1);
      }
      toggle.mutate({ habitId: habit.id, date: today });
    },
    [spawnParticle, toggle, today],
  );

  const todayHabits = useMemo(() => {
    const rows = habitsQuery.data ?? [];
    return rows.filter((h) => {
      if (h.type === 'daily') return isScheduledOn(schedulable(h), today);
      const target = h.targetPerWeek ?? 0;
      return (h.weekCount ?? 0) < target || h.completedToday;
    });
  }, [habitsQuery.data, today]);

  const doneCount = todayHabits.filter((h) => h.completedToday).length;
  const dailyScheduled = todayHabits.filter((h) => h.type === 'daily');
  const perfectDay = dailyScheduled.length > 0 && dailyScheduled.every((h) => h.completedToday);

  if (habitsQuery.isPending || creatureQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
        <View className="gap-4 px-6 pt-8">
          <Skeleton className="h-56 rounded-b-[90px]" />
          <Skeleton className="h-10 w-2/3 self-center" />
          <Skeleton className="mt-4 h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </View>
      </SafeAreaView>
    );
  }

  if (habitsQuery.isError || creatureQuery.isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-cream px-10">
        <Creature stage="egg" mood="sad" size={100} />
        <Text className="text-center font-sans-bold text-base text-ink">
          Couldn't reach the server. Is the API running?
        </Text>
        <Button
          label="Try again"
          onPress={() => {
            void habitsQuery.refetch();
            void creatureQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  const creature = creatureQuery.data;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView contentContainerClassName="pb-8">
        {/* Creature area */}
        <View className="items-center px-6 pt-2">
          <View className="w-full flex-row items-center justify-between">
            <Text className="font-sans-bold text-sm text-ink/50">
              Hi {user?.displayName ?? 'there'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void signOut()}
              hitSlop={8}
            >
              <Text className="font-sans-bold text-xs text-ink/40">log out</Text>
            </Pressable>
          </View>

          {/* pastel hill */}
          <View className="mt-2 w-full items-center rounded-b-[90px] rounded-t-card bg-mint-soft pb-6 pt-3">
            <Creature
              stage={creature.state.stage}
              mood={creature.state.mood}
              size={170}
              hopSignal={hopSignal}
              heartsSignal={heartsSignal}
            />
            <Text className="mt-1 font-sans-black text-xl text-ink">{creature.name}</Text>
          </View>

          <View className="mt-3 w-full flex-row items-center gap-3">
            <View className="h-12 min-w-12 items-center justify-center rounded-2xl bg-violet px-3">
              <Text className="font-sans-black text-lg text-white">Lv {creature.level.level}</Text>
            </View>
            <View className="flex-1">
              <XpBar level={creature.level} />
            </View>
          </View>
        </View>

        {/* Today */}
        <View className="mt-6 px-6">
          <View className="mb-3 flex-row items-end justify-between">
            <Text className="font-sans-black text-2xl text-ink">Today</Text>
            {perfectDay ? (
              <View className="flex-row items-center gap-1.5">
                <SparkleIcon size={20} />
                <Text className="font-sans-bold text-base text-ink">perfect day!</Text>
              </View>
            ) : (
              <Text className="font-sans-bold text-sm text-ink/50">
                {doneCount} of {todayHabits.length} done
              </Text>
            )}
          </View>

          {todayHabits.length === 0 ? (
            <View className="items-center gap-4 rounded-card bg-white p-8">
              <Text className="text-center font-sans-bold text-base text-ink">
                Nothing scheduled today.
              </Text>
              <Text className="text-center font-sans text-sm text-ink/60">
                Give {creature.name} something to cheer for!
              </Text>
              <Link href="/habits/new" asChild>
                <Pressable accessibilityRole="link" className="rounded-bubble bg-violet px-6 py-3">
                  <Text className="font-sans-bold text-white">Create a habit</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View>
              <View className="gap-3">
                {todayHabits.map((habit) => (
                  <TodayHabitCard
                    key={habit.id}
                    habit={habit}
                    particles={particles[habit.id] ?? []}
                    shakeKey={shakeKeys[habit.id] ?? 0}
                    onToggle={() => handleToggle(habit)}
                  />
                ))}
              </View>
              {shimmerKey > 0 && <RainbowShimmer key={shimmerKey} />}
              {perfectDay && (
                <Text className="mt-3 text-center font-sans text-sm text-ink/50">
                  Everything done — {creature.name} is glowing. See you tomorrow!
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {celebration?.kind === 'levelUp' && (
        <CelebrationOverlay
          level={celebration.level}
          creatureName={creature.name}
          onDone={() => setCelebration(null)}
        />
      )}
      {celebration?.kind === 'evolution' && (
        <EvolutionOverlay
          from={celebration.from}
          to={celebration.to}
          creatureName={creature.name}
          onDone={() => setCelebration(null)}
        />
      )}
    </SafeAreaView>
  );
}
