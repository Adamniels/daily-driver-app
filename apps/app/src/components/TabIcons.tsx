/**
 * Tab bar icons, drawn to match the app's own shapes: the home tab is the
 * creature blob silhouette, the habits tab is the round checkbox. They take
 * the tint color from the tab navigator so active/inactive states match
 * the labels.
 */
import Svg, { Circle, Path } from 'react-native-svg';

interface TabIconProps {
  color: string;
  size?: number;
}

/** The companion's silhouette (same body path family as Creature.tsx). */
export function BlobTabIcon({ color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Path
        d="M100 30 C 150 30 168 76 168 116 a68 62 0 0 1 -136 0 C 32 76 50 30 100 30 z"
        fill={color}
      />
      <Circle cx={75} cy={95} r={9} fill="white" />
      <Circle cx={125} cy={95} r={9} fill="white" />
    </Svg>
  );
}

/** The round habit checkbox with its check mark. */
export function CheckTabIcon({ color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2.5} fill="none" />
      <Path
        d="M7.5 12.5 L10.5 15.5 L16.5 8.5"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
