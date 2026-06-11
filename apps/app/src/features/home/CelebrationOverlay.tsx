/**
 * Level up moment: confetti rain + a big "Level N!" card. If the stage
 * changed too, the evolution gets its own line (full evolution art is a
 * Phase 7 task — this is the deliberately simple version).
 */
import { useEffect } from 'react';
import { Dimensions, Pressable, Text } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import type { Stage } from '@habit/core';
import { SparkleIcon } from '@/components/icons';
import { palette } from '@/theme/colors';

const CONFETTI_COLORS = [palette.violet, palette.mint, palette.coral, palette.sunshine, palette.sky, palette.rose];
const PIECES = 26;

function ConfettiPiece({ index }: { index: number }) {
  const { height, width } = Dimensions.get('window');
  const progress = useSharedValue(0);
  const startX = ((index * 37) % 100) / 100 * width;
  const delay = (index * 53) % 400;
  const spin = ((index % 2 === 0 ? 1 : -1) * (360 + ((index * 97) % 360)));
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length] ?? palette.violet;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1900 + ((index * 71) % 600), easing: Easing.in(Easing.quad) }),
    );
  }, [progress, delay, index]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.9 ? 1 : 1 - (progress.value - 0.9) * 10,
    transform: [
      { translateY: -40 + progress.value * (height + 80) },
      { rotate: `${spin * progress.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[style, { position: 'absolute', left: startX, top: 0, backgroundColor: color }]}
      className="h-3 w-2 rounded-sm"
      pointerEvents="none"
    />
  );
}

interface CelebrationOverlayProps {
  level: number;
  creatureName: string;
  evolvedTo: Stage | null;
  onDone: () => void;
}

export function CelebrationOverlay({ level, creatureName, evolvedTo, onDone }: CelebrationOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Pressable
      onPress={onDone}
      className="absolute inset-0 z-50 items-center justify-center"
      accessibilityLabel="Dismiss celebration"
    >
      <Animated.View entering={FadeIn} className="absolute inset-0 bg-ink/30" />
      {Array.from({ length: PIECES }, (_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
      <Animated.View
        entering={ZoomIn.springify().damping(12)}
        className="items-center gap-2 rounded-card bg-white px-10 py-8 shadow-lg"
      >
        <SparkleIcon size={36} />
        <Text className="font-sans-black text-3xl text-violet">Level {level}!</Text>
        {evolvedTo ? (
          <Text className="text-center font-sans-bold text-base text-ink">
            {creatureName} evolved into a {evolvedTo}!
          </Text>
        ) : (
          <Text className="text-center font-sans text-sm text-ink/60">
            {creatureName} is getting stronger.
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
