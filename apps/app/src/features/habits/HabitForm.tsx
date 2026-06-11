/**
 * Shared create/edit form. Type is immutable after creation (the shared
 * schema enforces it — switching daily↔weekly would rewrite streak
 * semantics), so the toggle only renders in create mode.
 */
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ColorToken } from '@habit/shared';
import type { Weekday } from '@habit/core';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Stepper } from '@/components/Stepper';
import { colorTokens, habitColors } from '@/theme/colors';

const EMOJIS = [
  '✨', '💪', '🏃', '🧘', '🏋️', '🚴', '🏊', '🥾', '⚽', '🧗',
  '📚', '✍️', '🧠', '💻', '🎓', '🔬', '🗣️', '🎯', '♟️', '🧩',
  '💧', '🥗', '🍎', '😴', '🦷', '🧴', '💊', '🌞', '🚭', '🧖',
  '🎸', '🎹', '🎨', '📷', '🎮', '🪴', '🍳', '🧵', '📝', '🎧',
  '🧹', '🛏️', '🌱', '🐕', '💰', '📥', '♻️', '🚿', '🧺', '🔧',
  '🙏', '❤️', '📞', '💌', '🫂', '☕', '🌙', '⏰', '🚶', '🧊',
];

const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

export interface HabitFormValues {
  name: string;
  emoji: string;
  color: ColorToken;
  type: 'daily' | 'weekly';
  /** Daily: null = every day. */
  scheduledDays: Weekday[] | null;
  targetPerWeek: number;
  baseXp: number;
}

export const DEFAULT_VALUES: HabitFormValues = {
  name: '',
  emoji: '✨',
  color: 'violet',
  type: 'daily',
  scheduledDays: null,
  targetPerWeek: 3,
  baseXp: 10,
};

interface HabitFormProps {
  initial: HabitFormValues;
  mode: 'create' | 'edit';
  busy: boolean;
  onSubmit: (values: HabitFormValues) => void;
  footer?: React.ReactNode;
}

function SectionLabel({ children }: { children: string }) {
  return <Text className="mb-2 mt-5 font-sans-bold text-sm text-ink/70">{children}</Text>;
}

export function HabitForm({ initial, mode, busy, onSubmit, footer }: HabitFormProps) {
  const [values, setValues] = useState<HabitFormValues>(initial);
  const set = <K extends keyof HabitFormValues>(key: K, value: HabitFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const toggleDay = (day: Weekday) => {
    const current = values.scheduledDays ?? WEEKDAYS.map((d) => d.key);
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    // All seven (or none) selected = every day = null.
    set('scheduledDays', next.length === 0 || next.length === 7 ? null : next);
  };

  const selectedDays = values.scheduledDays ?? WEEKDAYS.map((d) => d.key);

  return (
    <ScrollView contentContainerClassName="px-6 pb-10" keyboardShouldPersistTaps="handled">
      <Input
        label="Name"
        value={values.name}
        onChangeText={(t) => set('name', t)}
        placeholder="Morning run"
        maxLength={60}
      />

      <SectionLabel>Emoji</SectionLabel>
      <View className="flex-row flex-wrap gap-2">
        {EMOJIS.map((emoji) => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            onPress={() => set('emoji', emoji)}
            className={`h-11 w-11 items-center justify-center rounded-xl ${
              values.emoji === emoji ? 'bg-violet-soft border-2 border-violet' : 'bg-white'
            }`}
          >
            <Text className="text-xl">{emoji}</Text>
          </Pressable>
        ))}
      </View>

      <SectionLabel>Color</SectionLabel>
      <View className="flex-row gap-3">
        {colorTokens.map((token) => (
          <Pressable
            key={token}
            accessibilityRole="button"
            accessibilityLabel={`color ${token}`}
            onPress={() => set('color', token)}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{
              backgroundColor: habitColors[token].main,
              borderWidth: values.color === token ? 4 : 0,
              borderColor: '#3D3A4B33',
            }}
          />
        ))}
      </View>

      {mode === 'create' && (
        <>
          <SectionLabel>Type</SectionLabel>
          <View className="flex-row gap-2">
            {(['daily', 'weekly'] as const).map((type) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                onPress={() => set('type', type)}
                className={`flex-1 items-center rounded-2xl py-3 ${
                  values.type === type ? 'bg-violet' : 'bg-white'
                }`}
              >
                <Text
                  className={`font-sans-bold text-base ${
                    values.type === type ? 'text-white' : 'text-ink/60'
                  }`}
                >
                  {type === 'daily' ? 'Daily' : 'Weekly'}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {values.type === 'daily' ? (
        <>
          <SectionLabel>Days (tap to skip a day)</SectionLabel>
          <View className="flex-row gap-2">
            {WEEKDAYS.map(({ key, label }) => {
              const on = selectedDays.includes(key);
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={key}
                  onPress={() => toggleDay(key)}
                  className={`h-11 w-11 items-center justify-center rounded-full ${
                    on ? 'bg-violet' : 'bg-white'
                  }`}
                >
                  <Text className={`font-sans-bold ${on ? 'text-white' : 'text-ink/40'}`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-2 font-sans text-xs text-ink/50">
            {values.scheduledDays === null ? 'Every day' : `${selectedDays.length} days a week`}
          </Text>
        </>
      ) : (
        <>
          <SectionLabel>Times per week</SectionLabel>
          <Stepper
            value={values.targetPerWeek}
            min={1}
            max={7}
            onChange={(v) => set('targetPerWeek', v)}
          />
        </>
      )}

      <SectionLabel>Base XP</SectionLabel>
      <Stepper value={values.baseXp} min={5} max={30} step={5} onChange={(v) => set('baseXp', v)} suffix=" XP" />

      <View className="mt-8 gap-3">
        <Button
          label={busy ? 'Saving…' : mode === 'create' ? 'Create habit' : 'Save changes'}
          onPress={() => onSubmit({ ...values, name: values.name.trim() })}
          disabled={busy || values.name.trim().length === 0}
        />
        {footer}
      </View>
    </ScrollView>
  );
}
