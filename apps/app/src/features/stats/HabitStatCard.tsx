/**
 * Per habit stats: streaks, 30 day completion rate bar, last 14 days as a
 * dot row (filled = done, hollow = missed, faint = unscheduled, ring =
 * today still pending).
 */
import { Text, View } from 'react-native';
import type { ColorToken } from '@habit/shared';
import { StreakFlame } from '@/components/StreakFlame';
import { TrophyIcon } from '@/components/icons';
import type { RouterOutputs } from '@/lib/trpc';
import { habitColors, palette } from '@/theme/colors';

type HabitDetail = RouterOutputs['stats']['habitDetail'];

function Dot({ status, color }: { status: HabitDetail['last14'][number]['status']; color: string }) {
  switch (status) {
    case 'done':
      return <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />;
    case 'missed':
      return (
        <View
          style={{
            width: 9,
            height: 9,
            borderRadius: 5,
            borderWidth: 1.5,
            borderColor: `${palette.ink}33`,
          }}
        />
      );
    case 'pending':
      return (
        <View
          style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: color }}
        />
      );
    case 'unscheduled':
      return (
        <View
          style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: `${palette.ink}0F` }}
        />
      );
  }
}

export function HabitStatCard({ detail }: { detail: HabitDetail }) {
  const colors = habitColors[detail.habit.color as ColorToken] ?? habitColors.violet;
  // rate30 is null when the habit had no scheduled slots in the window.
  const ratePct = Math.round((detail.rate30 ?? 0) * 100);

  return (
    <View className="gap-3 rounded-card bg-white p-4 shadow-sm shadow-ink/10">
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.soft }}
        >
          <Text className="text-xl">{detail.habit.emoji}</Text>
        </View>
        <Text className="flex-1 font-sans-bold text-base text-ink" numberOfLines={1}>
          {detail.habit.name}
        </Text>
        <StreakFlame streak={detail.currentStreak} />
        <View className="flex-row items-center gap-1 rounded-full bg-ink/5 py-1 pl-2 pr-2.5">
          <TrophyIcon size={14} />
          <Text className="font-sans-bold text-sm text-ink/60">{detail.bestStreak}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-ink/5">
          <View
            className="h-full rounded-full"
            style={{ width: `${ratePct}%`, backgroundColor: colors.main }}
          />
        </View>
        <Text className="w-12 text-right font-sans-bold text-xs text-ink/50">{ratePct}%</Text>
      </View>

      <View className="flex-row items-center justify-between">
        {detail.last14.map((day) => (
          <Dot key={day.date} status={day.status} color={colors.main} />
        ))}
      </View>
    </View>
  );
}
