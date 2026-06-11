/** Chunky spring button: scales down on press, pops back on release. */
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const variantClasses = {
  primary: 'bg-violet',
  secondary: 'bg-violet-soft',
  danger: 'bg-coral',
} as const;

const labelClasses = {
  primary: 'text-white',
  secondary: 'text-violet',
  danger: 'text-white',
} as const;

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 250 });
      }}
      onPress={onPress}
    >
      <Animated.View
        style={animatedStyle}
        className={`min-h-12 items-center justify-center rounded-bubble px-6 py-3.5 ${variantClasses[variant]} ${disabled ? 'opacity-40' : ''}`}
      >
        <Text className={`font-sans-bold text-lg ${labelClasses[variant]}`}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}
