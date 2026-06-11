/** − / + stepper with chunky touch targets. */
import { Pressable, Text, View } from 'react-native';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
}

function StepButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      className={`h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft ${disabled ? 'opacity-30' : ''}`}
    >
      <Text className="font-sans-black text-xl text-violet">{label}</Text>
    </Pressable>
  );
}

export function Stepper({ value, min, max, step = 1, onChange, suffix = '' }: StepperProps) {
  return (
    <View className="flex-row items-center gap-3">
      <StepButton label="−" disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} />
      <Text className="min-w-16 text-center font-sans-black text-xl text-ink">
        {value}
        {suffix}
      </Text>
      <StepButton label="+" disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} />
    </View>
  );
}
