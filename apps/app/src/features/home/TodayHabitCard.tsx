/**
 * One habit in today's list. Optimistic state arrives via props (the cache
 * is updated in onMutate), so the card itself is a pure renderer plus
 * animations: done tint, error shake, XP particles near the checkbox.
 */
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { ColorToken } from '@habit/shared';
import { Checkbox } from '@/components/Checkbox';
import { StreakFlame } from '@/components/StreakFlame';
import { habitColors } from '@/theme/colors';
import type { HabitRow } from '@/lib/trpc';
import { XpParticle } from './XpParticle';

export interface Particle {
  key: number;
  amount: number;
}

interface TodayHabitCardProps {
  habit: HabitRow;
  particles: Particle[];
  shakeKey: number;
  onToggle: () => void;
}

export function TodayHabitCard({ habit, particles, shakeKey, onToggle }: TodayHabitCardProps) {
  const colors = habitColors[habit.color as ColorToken] ?? habitColors.violet;
  const done = habit.completedToday;
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (shakeKey > 0) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 60 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [shakeKey, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  return (
    <Animated.View
      style={[shakeStyle, done ? { backgroundColor: colors.soft } : null]}
      className="flex-row items-center gap-3 rounded-card bg-white p-4 shadow-sm shadow-ink/10"
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: done ? '#FFFFFF99' : colors.soft }}
      >
        <Text className="text-2xl">{habit.emoji}</Text>
      </View>

      <View className="flex-1 gap-1">
        <Text
          className={`font-sans-bold text-base ${done ? 'text-ink/50' : 'text-ink'}`}
          numberOfLines={1}
        >
          {habit.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <StreakFlame streak={habit.currentStreak} />
          {habit.type === 'weekly' && habit.targetPerWeek !== null && (
            <View className="rounded-full bg-sky-soft px-2 py-0.5">
              <Text className="font-sans-bold text-xs text-ink/70">
                {habit.weekCount ?? 0}/{habit.targetPerWeek} this week
              </Text>
            </View>
          )}
        </View>
      </View>

      <View>
        <Checkbox checked={done} color={colors.main} onToggle={onToggle} />
        {particles.map((p) => (
          <XpParticle key={p.key} amount={p.amount} seed={p.key} />
        ))}
      </View>
    </Animated.View>
  );
}
