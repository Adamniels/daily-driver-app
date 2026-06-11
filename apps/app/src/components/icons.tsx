/**
 * Small inline SVG icons. The app's rule: no emoji anywhere in the UI —
 * the only emoji on screen is the one the user picked for a habit.
 */
import Svg, { Path } from 'react-native-svg';
import { palette } from '@/theme/colors';

interface IconProps {
  size?: number;
  color?: string;
}

/** Streak flame: outer flame + inner glow. Pass a color to flatten both. */
export function FlameIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 C 13 6 17 7.5 17.5 12 a5.5 6 0 0 1 -11 0 C 6.5 9 8 8 8.5 5.5 C 9.5 7 10 7.5 10.5 8.5 C 11.5 6.5 11.5 4.5 12 2 z"
        fill={color ?? palette.coral}
      />
      <Path
        d="M12 11 c 1.4 1.6 2.2 2.4 2.2 4 a2.2 2.6 0 0 1 -4.4 0 c 0 -1.6 0.8 -2.4 2.2 -4 z"
        fill={color ?? palette.sunshine}
      />
    </Svg>
  );
}

/** Four point sparkle (perfect day, evolutions). */
export function SparkleIcon({ size = 14, color = palette.sunshine }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 l2.2 7.8 L22 12 l-7.8 2.2 L12 22 l-2.2 -7.8 L2 12 l7.8 -2.2 z"
        fill={color}
      />
    </Svg>
  );
}

/** Heart for the creature's affection bursts. */
export function HeartIcon({ size = 22, color = palette.violet }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21 C 7 16.5 3 13.5 3 9.5 A 4.5 4.5 0 0 1 12 6.5 A 4.5 4.5 0 0 1 21 9.5 C 21 13.5 17 16.5 12 21 z"
        fill={color}
      />
    </Svg>
  );
}
