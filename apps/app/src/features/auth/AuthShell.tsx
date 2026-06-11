/** Shared frame for login/register: egg illustration, app name, warm copy. */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Creature } from '@/creature/Creature';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center gap-2 px-8 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <Creature stage="egg" mood="okay" size={110} />
          <Text className="font-sans-black text-3xl text-ink">Habit Quest</Text>
          <Text className="mb-1 font-sans-bold text-lg text-violet">{title}</Text>
          <Text className="mb-4 text-center font-sans text-sm text-ink/60">{subtitle}</Text>
          <View className="w-full max-w-96 gap-4">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
