/**
 * Animated XP progress bar. The fill springs to the new fraction; when a
 * level up resets progress the bar sweeps to full, snaps back and fills
 * again, which reads as "bar overflowed into the next level".
 */
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { LevelInfo } from '@habit/core';

const SPRING = { damping: 18, stiffness: 120 };

export function XpBar({ level }: { level: LevelInfo }) {
  const fraction = useSharedValue(level.progress);
  const prevLevel = useRef(level.level);

  useEffect(() => {
    if (level.level > prevLevel.current) {
      // Leveled up: sweep to full, snap to zero, fill to the new progress.
      fraction.value = withSequence(
        withTiming(1, { duration: 250 }),
        withTiming(0, { duration: 0 }),
        withSpring(level.progress, SPRING),
      );
    } else if (level.level < prevLevel.current) {
      // Un-leveled (toggle off reversed XP): just settle to the truth.
      fraction.value = withSpring(level.progress, SPRING);
    } else {
      fraction.value = withSpring(level.progress, SPRING);
    }
    prevLevel.current = level.level;
  }, [level.level, level.progress, fraction]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, fraction.value)) * 100}%`,
  }));

  return (
    <View className="w-full">
      <View className="h-4 w-full overflow-hidden rounded-full bg-violet-soft">
        <Animated.View style={fillStyle} className="h-full rounded-full bg-violet" />
      </View>
      <Text className="mt-1 text-center font-sans text-xs text-ink/60">
        {level.xpIntoLevel} / {level.xpForNextLevel} XP
      </Text>
    </View>
  );
}
