/**
 * Small inline SVG icons. The app's rule: no emoji anywhere in the UI —
 * the only emoji on screen is the one the user picked for a habit.
 *
 * Icons are flat, single color shapes on purpose: multicolor miniatures
 * read as emoji. At small sizes the palette's sunshine is too pale against
 * cream, so icons use a saturated gold variant.
 */
import Svg, { Path } from 'react-native-svg';
import { palette } from '@/theme/colors';

/** Sunshine, saturated for small-size contrast. */
export const ICON_GOLD = '#F0A91F';

interface IconProps {
  size?: number;
  color?: string;
}

/** Streak flame: one flat shape with a cutout notch at the base. */
export function FlameIcon({ size = 16, color = palette.coral }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2
           C 12.4 5.2 14.6 7 16.4 9.2
           C 18 11.2 18.6 13.2 18.2 15.4
           C 17.6 18.8 15 21 12 21
           C 9 21 6.4 18.8 5.8 15.4
           C 5.4 13.2 6.2 11 7.6 9.4
           C 8.4 8.5 9.2 7.7 9.8 6.6
           C 10.3 7.8 10.6 8.7 10.6 10
           C 11.6 8 12.2 5 12 2 z
           M 12 19.8
           C 13.5 19.8 14.6 18.7 14.6 17.3
           C 14.6 16 13.7 15.1 12 13.6
           C 10.3 15.1 9.4 16 9.4 17.3
           C 9.4 18.7 10.5 19.8 12 19.8 z"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  );
}

/** Four point sparkle with concave curves (perfect day, level up). */
export function SparkleIcon({ size = 18, color = ICON_GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 1.5
           C 13 7.5 16.5 11 22.5 12
           C 16.5 13 13 16.5 12 22.5
           C 11 16.5 7.5 13 1.5 12
           C 7.5 11 11 7.5 12 1.5 z"
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
