/** Streak indicator: flame + count. Dimmed when the streak is 0. */
import { Text, View } from 'react-native';
import { FlameIcon } from './icons';
import { palette } from '@/theme/colors';

export function StreakFlame({ streak }: { streak: number }) {
  const active = streak > 0;
  return (
    <View
      className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${
        active ? 'bg-sunshine-soft' : 'bg-ink/5'
      }`}
    >
      {active ? <FlameIcon size={12} /> : <FlameIcon size={12} color={palette.inkSoft} />}
      <Text
        className={`font-sans-bold text-xs ${active ? 'text-ink' : 'text-ink/40'}`}
      >
        {streak}
      </Text>
    </View>
  );
}
