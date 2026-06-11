/** Streak indicator: flame + count. Dimmed when the streak is 0. */
import { Text, View } from 'react-native';
import { FlameIcon } from './icons';
import { palette } from '@/theme/colors';

export function StreakFlame({ streak }: { streak: number }) {
  const active = streak > 0;
  return (
    <View
      className={`flex-row items-center gap-1 rounded-full py-1 pl-2 pr-2.5 ${
        active ? 'bg-sunshine-soft' : 'bg-ink/5'
      }`}
    >
      <FlameIcon size={16} color={active ? palette.coral : palette.inkSoft} />
      <Text className={`font-sans-bold text-sm ${active ? 'text-ink' : 'text-ink/40'}`}>
        {streak}
      </Text>
    </View>
  );
}
