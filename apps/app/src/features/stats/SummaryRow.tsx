/** Three stat chips: level (mini XP ring), total XP, active streaks. */
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { ReactNode } from 'react';
import { CountUp } from '@/components/CountUp';
import { FlameIcon } from '@/components/icons';
import type { RouterOutputs } from '@/lib/trpc';
import { palette } from '@/theme/colors';

type Summary = RouterOutputs['stats']['summary'];

/**
 * Ring showing progress into the current level. Explicit sizes and the
 * label absolutely centered over the SVG — no relative sizing tricks.
 */
const RING_SIZE = 50;

function LevelRing({ level, progress }: { level: number; progress: number }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE} viewBox="0 0 50 50">
        <Circle cx={25} cy={25} r={r} stroke={`${palette.violet}26`} strokeWidth={5} fill="none" />
        <Circle
          cx={25}
          cy={25}
          r={r}
          stroke={palette.violet}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - Math.max(0.02, Math.min(1, progress)))}
          transform="rotate(-90 25 25)"
        />
      </Svg>
      <Text
        className="font-sans-black text-base text-violet"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          textAlign: 'center',
          lineHeight: RING_SIZE,
        }}
      >
        {level}
      </Text>
    </View>
  );
}

function Chip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-card bg-white p-3 shadow-sm shadow-ink/10">
      <View className="h-14 items-center justify-center">{children}</View>
      <Text className="font-sans-bold text-xs text-ink/50">{label}</Text>
    </View>
  );
}

export function SummaryRow({ summary }: { summary: Summary }) {
  return (
    <View className="flex-row gap-3">
      <Chip label="level">
        <LevelRing level={summary.level.level} progress={summary.level.progress} />
      </Chip>
      <Chip label="total XP">
        <CountUp value={summary.totalXp} className="font-sans-black text-2xl text-ink" />
      </Chip>
      <Chip label="active streaks">
        <View className="flex-row items-center gap-1">
          <FlameIcon size={20} />
          <CountUp value={summary.activeStreaks} className="font-sans-black text-2xl text-ink" />
        </View>
      </Chip>
    </View>
  );
}
