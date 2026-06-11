/** Streak indicator: flame + count. Dimmed when the streak is 0. */
import { Text, View } from 'react-native';

export function StreakFlame({ streak }: { streak: number }) {
  const active = streak > 0;
  return (
    <View
      className={`flex-row items-center gap-0.5 rounded-full px-2 py-0.5 ${
        active ? 'bg-sunshine-soft' : 'bg-ink/5'
      }`}
    >
      <Text className={`text-xs ${active ? '' : 'opacity-40'}`}>🔥</Text>
      <Text
        className={`font-sans-bold text-xs ${active ? 'text-ink' : 'text-ink/40'}`}
      >
        {streak}
      </Text>
    </View>
  );
}
