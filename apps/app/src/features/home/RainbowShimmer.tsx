/**
 * Perfect day: a soft rainbow band sweeps once across the today list.
 * Parent overlays it (absolute, overflow hidden) and remounts via key
 * to replay.
 */
import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/theme/colors';

const COLORS = [palette.violet, palette.sky, palette.mint, palette.sunshine, palette.coral, palette.rose];
const BAND_W = 140;

export function RainbowShimmer() {
  const width = Dimensions.get('window').width;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.85 ? 0.28 : 0.28 * (1 - (progress.value - 0.85) / 0.15),
    transform: [
      { translateX: -BAND_W * 2 + (width + BAND_W * 3) * progress.value },
      { skewX: '-18deg' },
    ],
  }));

  return (
    <View className="absolute inset-0 overflow-hidden rounded-card" pointerEvents="none">
      <Animated.View style={[style, { flexDirection: 'row', height: '100%', width: BAND_W }]}>
        {COLORS.map((color) => (
          <View key={color} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </Animated.View>
    </View>
  );
}
