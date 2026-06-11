/**
 * The marquee moment — it happens five times ever. Three beats driven by
 * a small state machine: the old form charges (glow swells, body shakes),
 * a white flash, then the new form pops in with sparkles and a name card.
 * Tap anywhere to skip; auto-dismisses after the reveal breathes.
 */
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import type { Stage } from '@habit/core';
import { SparkleIcon } from '@/components/icons';
import { CreatureArt } from '@/creature/Creature';
import { palette } from '@/theme/colors';

const STAGE_LABEL: Record<Stage, string> = {
  egg: 'Egg',
  hatchling: 'Hatchling',
  sprout: 'Sprout',
  juvenile: 'Juvenile',
  adult: 'Adult',
  mythic: 'Mythic',
};

const CHARGE_MS = 1400;
const FLASH_MS = 180;
const REVEAL_MS = 2400;

interface EvolutionOverlayProps {
  from: Stage;
  to: Stage;
  creatureName: string;
  onDone: () => void;
}

function ChargingCreature({ stage }: { stage: Stage }) {
  const shake = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    shake.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 60 }),
        withTiming(3, { duration: 60 }),
      ),
      -1,
    );
    glow.value = withTiming(1, { duration: CHARGE_MS, easing: Easing.in(Easing.quad) });
  }, [shake, glow]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { scale: 1 + 0.08 * glow.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + 0.75 * glow.value,
    transform: [{ scale: 0.8 + 0.6 * glow.value }],
  }));

  return (
    <View style={{ width: 180, height: 180 }}>
      <Animated.View
        style={[
          glowStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: palette.sunshine,
          },
        ]}
      />
      <Animated.View style={[bodyStyle, { width: 180, height: 180 }]}>
        <CreatureArt stage={stage} mood="happy" eyes={{ blink: false, lookX: 0 }} />
      </Animated.View>
    </View>
  );
}

function RevealSparkle({ index }: { index: number }) {
  const angle = (index / 8) * 2 * Math.PI;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * 110 * progress.value },
      { translateY: Math.sin(angle) * 110 * progress.value },
      { scale: 0.6 + progress.value },
    ],
  }));

  return (
    <Animated.View style={[style, { position: 'absolute' }]} pointerEvents="none">
      <SparkleIcon size={18} />
    </Animated.View>
  );
}

export function EvolutionOverlay({ from, to, creatureName, onDone }: EvolutionOverlayProps) {
  const [beat, setBeat] = useState<'charging' | 'flash' | 'reveal'>('charging');

  useEffect(() => {
    const t1 = setTimeout(() => setBeat('flash'), CHARGE_MS);
    const t2 = setTimeout(() => setBeat('reveal'), CHARGE_MS + FLASH_MS);
    const t3 = setTimeout(onDone, CHARGE_MS + FLASH_MS + REVEAL_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <Pressable
      onPress={onDone}
      accessibilityLabel="Skip evolution"
      className="absolute inset-0 z-50 items-center justify-center"
    >
      <Animated.View entering={FadeIn.duration(250)} className="absolute inset-0 bg-ink/70" />

      {beat === 'charging' && <ChargingCreature stage={from} />}

      {beat === 'flash' && <View className="absolute inset-0 bg-white" />}

      {beat === 'reveal' && (
        <View className="items-center gap-4">
          <View className="items-center justify-center" style={{ width: 200, height: 200 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <RevealSparkle key={i} index={i} />
            ))}
            <Animated.View entering={ZoomIn.springify().damping(10)} style={{ width: 200, height: 200 }}>
              <CreatureArt stage={to} mood="thriving" eyes={{ blink: false, lookX: 0 }} />
            </Animated.View>
          </View>
          <Animated.View
            entering={ZoomIn.delay(250).springify().damping(12)}
            className="items-center gap-1 rounded-card bg-white px-10 py-5 shadow-lg"
          >
            <Text className="font-sans-black text-2xl text-violet">{STAGE_LABEL[to]}!</Text>
            <Text className="font-sans text-sm text-ink/60">{creatureName} evolved</Text>
          </Animated.View>
        </View>
      )}
    </Pressable>
  );
}
