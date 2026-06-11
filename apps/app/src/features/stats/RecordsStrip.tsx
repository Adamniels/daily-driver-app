/** Earned milestones, horizontal scroll. Quiet seed of an achievements system. */
import { ScrollView, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { CountUp } from '@/components/CountUp';
import { CheckCircleIcon, FlameIcon, SparkleIcon, TrophyIcon } from '@/components/icons';
import type { RouterOutputs } from '@/lib/trpc';

type Records = RouterOutputs['stats']['records'];

function RecordChip({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <View className="flex-row items-center gap-2.5 rounded-card bg-white px-4 py-3 shadow-sm shadow-ink/10">
      {icon}
      <View>
        <CountUp value={value} className="font-sans-black text-lg text-ink" />
        <Text className="font-sans text-xs text-ink/50">{label}</Text>
      </View>
    </View>
  );
}

export function RecordsStrip({ records }: { records: Records }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-6">
      <RecordChip icon={<TrophyIcon size={22} />} value={records.longestStreak} label="longest streak" />
      <RecordChip
        icon={<SparkleIcon size={22} />}
        value={records.bestDay?.xp ?? 0}
        label={records.bestDay ? `best day (${records.bestDay.date.slice(5)})` : 'best day'}
      />
      <RecordChip icon={<FlameIcon size={22} />} value={records.perfectDays} label="perfect days" />
      <RecordChip
        icon={<CheckCircleIcon size={22} />}
        value={records.totalCompletions}
        label="completions"
      />
    </ScrollView>
  );
}
