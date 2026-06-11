/**
 * The companion. One SVG blob character, varied by evolution stage and
 * animated by mood (docs/phase-4-app-home.md). Art is deliberately simple
 * and replaceable — the contract is { stage, mood, size } plus two
 * "signal" props that trigger reactions when their value increases:
 * hopSignal (habit checked) and heartsSignal (tap / perfect day).
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Mood, Stage } from '@habit/core';
import { palette } from '@/theme/colors';

interface CreatureProps {
  stage: Stage;
  mood: Mood;
  size: number;
  hopSignal?: number;
  heartsSignal?: number;
}

/** Idle bob per mood: amplitude (px at size 200) and period (ms). */
const IDLE: Record<Mood, { amp: number; period: number }> = {
  thriving: { amp: 7, period: 600 },
  happy: { amp: 5, period: 950 },
  okay: { amp: 3, period: 1500 },
  sad: { amp: 1.5, period: 2400 },
  sleeping: { amp: 0.8, period: 3200 },
};

function Eyes({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'thriving':
      return (
        <>
          <Circle cx={72} cy={88} r={9} fill={palette.ink} />
          <Circle cx={128} cy={88} r={9} fill={palette.ink} />
          <Circle cx={75} cy={84} r={3.2} fill="white" />
          <Circle cx={131} cy={84} r={3.2} fill="white" />
          {/* sparkles */}
          <Path d="M52 64 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill={palette.sunshine} />
          <Path d="M150 60 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill={palette.sunshine} />
        </>
      );
    case 'happy':
      return (
        <>
          <Circle cx={72} cy={88} r={8} fill={palette.ink} />
          <Circle cx={128} cy={88} r={8} fill={palette.ink} />
          <Circle cx={75} cy={85} r={2.6} fill="white" />
          <Circle cx={131} cy={85} r={2.6} fill="white" />
        </>
      );
    case 'okay':
      return (
        <>
          <Path d="M64 88 a8 8 0 0 1 16 0" fill="none" stroke={palette.ink} strokeWidth={5} strokeLinecap="round" />
          <Path d="M120 88 a8 8 0 0 1 16 0" fill="none" stroke={palette.ink} strokeWidth={5} strokeLinecap="round" />
        </>
      );
    case 'sad':
      return (
        <>
          <Circle cx={72} cy={92} r={6} fill={palette.ink} />
          <Circle cx={128} cy={92} r={6} fill={palette.ink} />
          {/* droopy brows */}
          <Path d="M60 78 l22 6" stroke={palette.ink} strokeWidth={4} strokeLinecap="round" />
          <Path d="M140 78 l-22 6" stroke={palette.ink} strokeWidth={4} strokeLinecap="round" />
        </>
      );
    case 'sleeping':
      return (
        <>
          <Path d="M62 90 q10 8 20 0" fill="none" stroke={palette.ink} strokeWidth={4.5} strokeLinecap="round" />
          <Path d="M118 90 q10 8 20 0" fill="none" stroke={palette.ink} strokeWidth={4.5} strokeLinecap="round" />
        </>
      );
  }
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'thriving':
      return <Path d="M86 110 q14 16 28 0 q-14 6 -28 0" fill={palette.ink} />;
    case 'happy':
      return <Path d="M88 110 q12 12 24 0" fill="none" stroke={palette.ink} strokeWidth={5} strokeLinecap="round" />;
    case 'okay':
      return <Path d="M90 114 h20" stroke={palette.ink} strokeWidth={5} strokeLinecap="round" />;
    case 'sad':
      return <Path d="M88 120 q12 -10 24 0" fill="none" stroke={palette.ink} strokeWidth={5} strokeLinecap="round" />;
    case 'sleeping':
      return <Circle cx={100} cy={116} r={5} fill={palette.ink} opacity={0.7} />;
  }
}

/** The blob body with stage accessories, drawn in a 200×200 viewBox. */
function CreatureArt({ stage, mood }: { stage: Stage; mood: Mood }) {
  if (stage === 'egg') {
    return (
      <Svg viewBox="0 0 200 200" width="100%" height="100%">
        <Path
          d="M100 28 C 140 28 162 78 162 118 a62 62 0 0 1 -124 0 C 38 78 60 28 100 28 z"
          fill="#FFFDF7"
          stroke={palette.sunshine}
          strokeWidth={5}
        />
        <Circle cx={82} cy={92} r={9} fill={palette.violet} opacity={0.25} />
        <Circle cx={124} cy={120} r={7} fill={palette.mint} opacity={0.3} />
        <Circle cx={104} cy={150} r={5} fill={palette.coral} opacity={0.3} />
      </Svg>
    );
  }

  const adultish = stage === 'adult' || stage === 'mythic';
  return (
    <Svg viewBox="0 0 200 200" width="100%" height="100%">
      {stage === 'mythic' && (
        <Circle cx={100} cy={108} r={86} fill={palette.sunshine} opacity={0.25} />
      )}
      {/* arms from juvenile on */}
      {(stage === 'juvenile' || adultish) && (
        <>
          <Ellipse cx={30} cy={120} rx={14} ry={22} fill={palette.violet} transform="rotate(20 30 120)" />
          <Ellipse cx={170} cy={120} rx={14} ry={22} fill={palette.violet} transform="rotate(-20 170 120)" />
        </>
      )}
      {/* body */}
      <Path
        d="M100 30 C 150 30 168 76 168 116 a68 62 0 0 1 -136 0 C 32 76 50 30 100 30 z"
        fill={palette.violet}
      />
      <Ellipse cx={100} cy={138} rx={42} ry={30} fill="#FFFDF7" opacity={0.85} />
      {/* leaf from sprout on */}
      {stage !== 'hatchling' && (
        <>
          <Path d="M100 30 q2 -16 14 -22" fill="none" stroke={palette.mint} strokeWidth={5} strokeLinecap="round" />
          <Path d="M114 8 q18 2 20 18 q-18 2 -20 -18 z" fill={palette.mint} />
        </>
      )}
      {/* adult accessory: a little scarf */}
      {adultish && (
        <>
          <Path d="M58 142 q42 22 84 0 l-4 14 q-38 18 -76 0 z" fill={palette.coral} />
          <Path d="M130 150 l10 26 q-12 4 -18 -4 z" fill={palette.coral} />
        </>
      )}
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* blush */}
      {(mood === 'thriving' || mood === 'happy') && (
        <>
          <Ellipse cx={56} cy={104} rx={9} ry={5.5} fill={palette.coral} opacity={0.45} />
          <Ellipse cx={144} cy={104} rx={9} ry={5.5} fill={palette.coral} opacity={0.45} />
        </>
      )}
    </Svg>
  );
}

function FloatingHeart({ index }: { index: number }) {
  const drift = (index % 3) - 1;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: -70 * progress.value },
      { translateX: drift * 26 * progress.value },
      { scale: 0.7 + 0.5 * progress.value },
    ],
  }));

  return (
    <Animated.View style={style} className="absolute left-1/2 top-6" pointerEvents="none">
      <Text className="text-2xl">💜</Text>
    </Animated.View>
  );
}

export function Creature({ stage, mood, size, hopSignal = 0, heartsSignal = 0 }: CreatureProps) {
  const bob = useSharedValue(0);
  const hop = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const heartId = useRef(0);
  const prevHop = useRef(hopSignal);
  const prevHearts = useRef(heartsSignal);

  // Idle bob, retuned whenever mood changes. Mythic floats a little extra.
  useEffect(() => {
    const { amp, period } = IDLE[mood];
    const extra = stage === 'mythic' ? 4 : 0;
    bob.value = 0;
    bob.value = withRepeat(
      withSequence(
        withTiming(-(amp + extra) * (size / 200), {
          duration: period,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, { duration: period, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [mood, stage, size, bob]);

  // Hop when a habit gets checked off.
  useEffect(() => {
    if (hopSignal > prevHop.current) {
      hop.value = withSequence(
        withSpring(-18 * (size / 200), { damping: 7, stiffness: 320 }),
        withSpring(0, { damping: 9, stiffness: 240 }),
      );
    }
    prevHop.current = hopSignal;
  }, [hopSignal, hop, size]);

  // Hearts on tap or perfect day.
  useEffect(() => {
    if (heartsSignal > prevHearts.current) {
      const burst = [heartId.current, heartId.current + 1, heartId.current + 2];
      heartId.current += 3;
      setHearts((current) => [...current, ...burst]);
      setTimeout(() => {
        setHearts((current) => current.filter((id) => !burst.includes(id)));
      }, 1200);
    }
    prevHearts.current = heartsSignal;
  }, [heartsSignal]);

  const wiggleAndHeart = () => {
    wiggle.value = withSequence(
      withTiming(-6, { duration: 70 }),
      withTiming(6, { duration: 90 }),
      withTiming(-4, { duration: 80 }),
      withTiming(0, { duration: 80 }),
    );
    const id = heartId.current;
    heartId.current += 1;
    setHearts((current) => [...current, id]);
    setTimeout(() => {
      setHearts((current) => current.filter((h) => h !== id));
    }, 1200);
  };

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value + hop.value },
      { rotate: `${wiggle.value}deg` },
    ],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Pressable accessibilityLabel="Your companion" onPress={wiggleAndHeart} hitSlop={4}>
        <Animated.View style={[bodyStyle, { width: size, height: size }]}>
          <CreatureArt stage={stage} mood={mood} />
        </Animated.View>
      </Pressable>
      {mood === 'sleeping' && <SleepyZzz />}
      {hearts.map((id, i) => (
        <FloatingHeart key={id} index={i} />
      ))}
    </View>
  );
}

function SleepyZzz() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * pulse.value,
    transform: [{ translateY: -6 * pulse.value }],
  }));

  return (
    <Animated.View style={style} className="absolute right-0 top-0" pointerEvents="none" exiting={FadeOut}>
      <Text className="text-2xl">💤</Text>
    </Animated.View>
  );
}
