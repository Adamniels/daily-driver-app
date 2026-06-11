/**
 * The companion. One SVG blob character, varied by evolution stage and
 * animated by mood. The idle motion is three layered loops — bob, sway
 * and breathing — tuned per mood, plus a blink loop and an occasional
 * pupil look-around, so it reads as alive rather than mechanical.
 *
 * Contract: { stage, mood, size } + two signal props that trigger
 * reactions when their value increases: hopSignal (habit checked) and
 * heartsSignal (tap / perfect day).
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
import { HeartIcon } from '@/components/icons';
import { palette } from '@/theme/colors';

interface CreatureProps {
  stage: Stage;
  mood: Mood;
  size: number;
  hopSignal?: number;
  heartsSignal?: number;
}

/** Idle motion per mood: bob amplitude/period, sway angle, breath depth. */
const IDLE: Record<Mood, { amp: number; period: number; sway: number; breath: number }> = {
  thriving: { amp: 7, period: 600, sway: 2.2, breath: 0.02 },
  happy: { amp: 5, period: 950, sway: 1.6, breath: 0.018 },
  okay: { amp: 3, period: 1500, sway: 1, breath: 0.015 },
  sad: { amp: 1.5, period: 2400, sway: 0.5, breath: 0.012 },
  sleeping: { amp: 0.6, period: 3200, sway: 0, breath: 0.03 },
};

const OPEN_EYED: readonly Mood[] = ['thriving', 'happy', 'sad'];

interface EyeState {
  blink: boolean;
  /** Pupil x offset, -3..3, for the occasional look around. */
  lookX: number;
}

function Eyes({ mood, eyes }: { mood: Mood; eyes: EyeState }) {
  const { blink, lookX } = eyes;

  if (mood === 'sleeping' || (blink && OPEN_EYED.includes(mood))) {
    return (
      <>
        <Path d="M62 90 q10 8 20 0" fill="none" stroke={palette.ink} strokeWidth={4.5} strokeLinecap="round" />
        <Path d="M118 90 q10 8 20 0" fill="none" stroke={palette.ink} strokeWidth={4.5} strokeLinecap="round" />
      </>
    );
  }

  switch (mood) {
    case 'thriving':
      return (
        <>
          <Circle cx={72 + lookX} cy={88} r={9} fill={palette.ink} />
          <Circle cx={128 + lookX} cy={88} r={9} fill={palette.ink} />
          <Circle cx={75 + lookX} cy={84} r={3.2} fill="white" />
          <Circle cx={131 + lookX} cy={84} r={3.2} fill="white" />
          <Path d="M52 64 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill={palette.sunshine} />
          <Path d="M150 60 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill={palette.sunshine} />
        </>
      );
    case 'happy':
      return (
        <>
          <Circle cx={72 + lookX} cy={88} r={8} fill={palette.ink} />
          <Circle cx={128 + lookX} cy={88} r={8} fill={palette.ink} />
          <Circle cx={75 + lookX} cy={85} r={2.6} fill="white" />
          <Circle cx={131 + lookX} cy={85} r={2.6} fill="white" />
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
          <Circle cx={72 + lookX} cy={92} r={6} fill={palette.ink} />
          <Circle cx={128 + lookX} cy={92} r={6} fill={palette.ink} />
          <Path d="M60 78 l22 6" stroke={palette.ink} strokeWidth={4} strokeLinecap="round" />
          <Path d="M140 78 l-22 6" stroke={palette.ink} strokeWidth={4} strokeLinecap="round" />
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
export function CreatureArt({ stage, mood, eyes }: { stage: Stage; mood: Mood; eyes: EyeState }) {
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
      {(stage === 'juvenile' || adultish) && (
        <>
          <Ellipse cx={30} cy={120} rx={14} ry={22} fill={palette.violet} transform="rotate(20 30 120)" />
          <Ellipse cx={170} cy={120} rx={14} ry={22} fill={palette.violet} transform="rotate(-20 170 120)" />
        </>
      )}
      <Path
        d="M100 30 C 150 30 168 76 168 116 a68 62 0 0 1 -136 0 C 32 76 50 30 100 30 z"
        fill={palette.violet}
      />
      <Ellipse cx={100} cy={138} rx={42} ry={30} fill="#FFFDF7" opacity={0.85} />
      {stage !== 'hatchling' && (
        <>
          <Path d="M100 30 q2 -16 14 -22" fill="none" stroke={palette.mint} strokeWidth={5} strokeLinecap="round" />
          <Path d="M114 8 q18 2 20 18 q-18 2 -20 -18 z" fill={palette.mint} />
        </>
      )}
      {adultish && (
        <>
          <Path d="M58 142 q42 22 84 0 l-4 14 q-38 18 -76 0 z" fill={palette.coral} />
          <Path d="M130 150 l10 26 q-12 4 -18 -4 z" fill={palette.coral} />
        </>
      )}
      <Eyes mood={mood} eyes={eyes} />
      <Mouth mood={mood} />
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
      <HeartIcon size={22} />
    </Animated.View>
  );
}

/** Blink + look-around driver: randomized timers, paused for closed-eye moods. */
function useEyeLife(stage: Stage, mood: Mood): EyeState {
  const [blink, setBlink] = useState(false);
  const [lookX, setLookX] = useState(0);

  useEffect(() => {
    if (stage === 'egg' || !OPEN_EYED.includes(mood)) return;
    let blinkTimer: ReturnType<typeof setTimeout>;
    let lookTimer: ReturnType<typeof setTimeout>;
    let alive = true;

    const scheduleBlink = () => {
      blinkTimer = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => {
          if (alive) setBlink(false);
        }, 140);
        scheduleBlink();
      }, 2500 + Math.random() * 2500);
    };
    const scheduleLook = () => {
      lookTimer = setTimeout(() => {
        if (!alive) return;
        setLookX(Math.random() < 0.5 ? -3 : 3);
        setTimeout(() => {
          if (alive) setLookX(0);
        }, 900);
        scheduleLook();
      }, 4000 + Math.random() * 4000);
    };
    scheduleBlink();
    scheduleLook();
    return () => {
      alive = false;
      clearTimeout(blinkTimer);
      clearTimeout(lookTimer);
    };
  }, [stage, mood]);

  return { blink, lookX };
}

export function Creature({ stage, mood, size, hopSignal = 0, heartsSignal = 0 }: CreatureProps) {
  const bob = useSharedValue(0);
  const sway = useSharedValue(0);
  const breathe = useSharedValue(0);
  const hop = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const heartId = useRef(0);
  const prevHop = useRef(hopSignal);
  const prevHearts = useRef(heartsSignal);
  const eyes = useEyeLife(stage, mood);

  // Three layered idle loops with different periods so motion never
  // repeats exactly. Retuned when mood changes.
  useEffect(() => {
    const { amp, period, sway: swayDeg, breath } = IDLE[mood];
    const extra = stage === 'mythic' ? 4 : 0;
    const ease = Easing.inOut(Easing.quad);
    bob.value = 0;
    bob.value = withRepeat(
      withSequence(
        withTiming(-(amp + extra) * (size / 200), { duration: period, easing: ease }),
        withTiming(0, { duration: period, easing: ease }),
      ),
      -1,
    );
    sway.value = 0;
    sway.value =
      swayDeg === 0
        ? 0
        : withRepeat(
            withSequence(
              withTiming(swayDeg, { duration: period * 1.7, easing: ease }),
              withTiming(-swayDeg, { duration: period * 1.7, easing: ease }),
            ),
            -1,
          );
    breathe.value = 0;
    breathe.value = withRepeat(
      withSequence(
        withTiming(breath, { duration: period * 1.3, easing: ease }),
        withTiming(0, { duration: period * 1.3, easing: ease }),
      ),
      -1,
    );
  }, [mood, stage, size, bob, sway, breathe]);

  useEffect(() => {
    if (hopSignal > prevHop.current) {
      hop.value = withSequence(
        withSpring(-18 * (size / 200), { damping: 7, stiffness: 320 }),
        withSpring(0, { damping: 9, stiffness: 240 }),
      );
    }
    prevHop.current = hopSignal;
  }, [hopSignal, hop, size]);

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
      { rotate: `${sway.value + wiggle.value}deg` },
      { scaleY: 1 + breathe.value },
      { scaleX: 1 - breathe.value * 0.6 },
    ],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Pressable accessibilityLabel="Your companion" onPress={wiggleAndHeart} hitSlop={4}>
        <Animated.View style={[bodyStyle, { width: size, height: size }]}>
          <CreatureArt stage={stage} mood={mood} eyes={eyes} />
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
      <Text className="font-sans-black text-xl text-ink/40">z z z</Text>
    </Animated.View>
  );
}
