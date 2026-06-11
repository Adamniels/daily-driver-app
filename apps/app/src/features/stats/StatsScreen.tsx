/**
 * Stats dashboard: summary chips, year heatmap, XP chart, per habit cards,
 * records strip. All math comes from core via the API; this screen only
 * renders. One HTTP round trip: the tRPC batch link folds the parallel
 * queries (including one habitDetail per habit) into a single request.
 */
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueries, useQuery } from '@tanstack/react-query';
import { addDays, mondayOfWeek } from '@habit/core';
import { Skeleton } from '@/components/Skeleton';
import { todayLocal } from '@/lib/dates';
import { useTRPC } from '@/lib/trpc';
import { HabitStatCard } from './HabitStatCard';
import { RecordsStrip } from './RecordsStrip';
import { SummaryRow } from './SummaryRow';
import { XpChart } from './XpChart';
import { YearHeatmap } from './YearHeatmap';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="font-sans-black text-lg text-ink">{title}</Text>
      {children}
    </View>
  );
}

export function StatsScreen() {
  const trpc = useTRPC();
  const today = todayLocal();
  // 52 full weeks before the current week's Monday → 53 columns.
  const gridStart = addDays(mondayOfWeek(today), -52 * 7);

  const summary = useQuery(trpc.stats.summary.queryOptions());
  const heatmap = useQuery(trpc.stats.heatmap.queryOptions({ from: gridStart, to: today }));
  const xpHistory = useQuery(trpc.stats.xpHistory.queryOptions({ days: 365 }));
  const records = useQuery(trpc.stats.records.queryOptions());
  const habits = useQuery(trpc.habits.list.queryOptions({}));

  const details = useQueries({
    queries: (habits.data ?? []).map((habit) =>
      trpc.stats.habitDetail.queryOptions({ habitId: habit.id }),
    ),
  });

  const xpByDate = useMemo(
    () => new Map((xpHistory.data ?? []).map((d) => [d.date, d.xp])),
    [xpHistory.data],
  );

  const last30 = useMemo(() => (xpHistory.data ?? []).slice(-30), [xpHistory.data]);

  /** Under a week of history: the heatmap is honest but nearly empty. */
  const earlyDays = useMemo(() => {
    const data = xpHistory.data ?? [];
    const first = data.find((d) => d.xp > 0);
    return !first || first.date > addDays(today, -7);
  }, [xpHistory.data, today]);

  const habitCards = details
    .map((q) => q.data)
    .filter((d): d is NonNullable<typeof d> => d !== undefined)
    .sort((a, b) => b.currentStreak - a.currentStreak);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView contentContainerClassName="gap-6 px-6 pb-10">
        <Text className="pt-2 font-sans-black text-2xl text-ink">Stats</Text>

        {summary.isPending ? (
          <Skeleton className="h-24" />
        ) : summary.data ? (
          <SummaryRow summary={summary.data} />
        ) : null}

        <Section title="Year">
          {heatmap.isPending ? (
            <Skeleton className="h-32" />
          ) : heatmap.data ? (
            <View className="gap-2 rounded-card bg-white p-4 shadow-sm shadow-ink/10">
              {earlyDays && (
                <Text className="font-sans text-xs text-ink/50">
                  Early days! The grid fills in as you build history.
                </Text>
              )}
              <YearHeatmap
                cells={heatmap.data}
                gridStart={gridStart}
                today={today}
                xpByDate={xpByDate}
              />
            </View>
          ) : null}
        </Section>

        <Section title="XP — last 30 days">
          {xpHistory.isPending ? (
            <Skeleton className="h-40" />
          ) : (
            <View className="rounded-card bg-white p-4 shadow-sm shadow-ink/10">
              <XpChart history={last30} />
            </View>
          )}
        </Section>

        <Section title="Habits">
          {habits.isPending ? (
            <Skeleton className="h-28" />
          ) : habitCards.length === 0 ? (
            <View className="items-center rounded-card bg-white p-6">
              <Text className="font-sans text-sm text-ink/50">
                No habit data yet — check something off!
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {habitCards.map((detail) => (
                <HabitStatCard key={detail.habit.id} detail={detail} />
              ))}
            </View>
          )}
        </Section>

        <Section title="Records">
          {records.isPending ? (
            <Skeleton className="h-16" />
          ) : records.data ? (
            <RecordsStrip records={records.data} />
          ) : null}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
