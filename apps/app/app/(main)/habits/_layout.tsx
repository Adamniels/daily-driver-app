import { Stack } from 'expo-router';
import { palette } from '@/theme/colors';

export default function HabitsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.cream },
      }}
    />
  );
}
