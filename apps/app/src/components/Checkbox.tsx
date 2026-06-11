/**
 * The big round habit checkbox. Pops with a spring when toggled on,
 * settles softly when toggled off. The check mark draws as a simple
 * SVG path; color comes from the habit's palette token.
 */
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

interface CheckboxProps {
  checked: boolean;
  color: string;
  onToggle: () => void;
}

export function Checkbox({ checked, color, onToggle }: CheckboxProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (checked) {
      scale.value = withSequence(
        withSpring(1.25, { damping: 9, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 250 });
    }
  }, [checked, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      hitSlop={8}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: checked ? color : 'transparent',
            borderWidth: 3,
            borderColor: color,
          },
        ]}
      >
        {checked && (
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M5 12.5 L10 17.5 L19 7"
              stroke="white"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        )}
      </Animated.View>
    </Pressable>
  );
}
