/** A "+12 XP" particle that drifts up from the checkbox and fades. */
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function XpParticle({ amount, seed }: { amount: number; seed: number }) {
  const progress = useSharedValue(0);
  const driftX = ((seed % 5) - 2) * 6;

  useEffect(() => {
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * progress.value,
    transform: [
      { translateY: -52 * progress.value },
      { translateX: driftX * progress.value },
      { scale: 0.8 + 0.4 * progress.value },
    ],
  }));

  return (
    <Animated.View style={style} className="absolute -top-2 right-2" pointerEvents="none">
      <Text className="font-sans-black text-base text-violet">+{amount} XP</Text>
    </Animated.View>
  );
}
