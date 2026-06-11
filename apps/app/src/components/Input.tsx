/** Labeled text input, warm and round. */
import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { palette } from '@/theme/colors';

interface InputProps extends TextInputProps {
  label: string;
}

export function Input({ label, ...rest }: InputProps) {
  return (
    <View className="w-full gap-1.5">
      <Text className="font-sans-bold text-sm text-ink/70">{label}</Text>
      <TextInput
        placeholderTextColor={palette.inkSoft}
        className="min-h-12 w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 font-sans text-base text-ink focus:border-violet"
        {...rest}
      />
    </View>
  );
}
