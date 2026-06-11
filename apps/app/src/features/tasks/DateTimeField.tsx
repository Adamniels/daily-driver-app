/**
 * Web fallback: plain text input parsed as local "YYYY-MM-DD HH:mm".
 * Local notifications don't exist on web — data is saved and reminders
 * fire on the phone (documented v1 limitation). The native picker lives
 * in DateTimeField.native.tsx (Metro resolves per platform).
 */
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { palette } from '@/theme/colors';

export interface DateTimeFieldProps {
  value: Date;
  onChange: (value: Date) => void;
}

function format(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  const [text, setText] = useState(format(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(format(value));
    setInvalid(false);
  }, [value]);

  const commit = () => {
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(text.trim());
    if (!m) {
      setInvalid(true);
      return;
    }
    const [, y, mo, d, h, mi] = m;
    const parsed = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
    if (Number.isNaN(parsed.getTime())) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange(parsed);
  };

  return (
    <View className="gap-1">
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        placeholder="2026-06-12 09:00"
        placeholderTextColor={palette.inkSoft}
        className="min-h-12 rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 font-sans text-base text-ink"
      />
      <Text className="font-sans text-xs text-ink/50">
        {invalid ? 'Use YYYY-MM-DD HH:mm' : 'Reminders fire on your phone, not in the browser.'}
      </Text>
    </View>
  );
}
