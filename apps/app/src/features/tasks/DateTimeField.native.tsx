/**
 * Native date + time picker. iOS renders the system compact pickers
 * inline; Android opens the system dialogs from chip buttons (Android
 * polish is deliberately out of scope for v1).
 */
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { formatDateTime } from '@/lib/dates';
import type { DateTimeFieldProps } from './DateTimeField';

export type { DateTimeFieldProps };

export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  if (Platform.OS === 'android') {
    const open = (mode: 'date' | 'time') => {
      DateTimePickerAndroid.open({
        value,
        mode,
        onChange: (_event, picked) => {
          if (picked) onChange(picked);
        },
      });
    };
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => open('date')}
        onLongPress={() => open('time')}
        className="min-h-12 justify-center rounded-2xl border-2 border-ink/10 bg-white px-4"
      >
        <Text className="font-sans text-base text-ink">{formatDateTime(value)}</Text>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-2">
      <DateTimePicker
        value={value}
        mode="date"
        display="compact"
        onChange={(_event, picked) => {
          if (picked) onChange(picked);
        }}
      />
      <DateTimePicker
        value={value}
        mode="time"
        display="compact"
        onChange={(_event, picked) => {
          if (picked) onChange(picked);
        }}
      />
    </View>
  );
}
