import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { palette } from '@/theme/colors';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'loading') return null;
  if (status === 'signedIn') return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.cream },
      }}
    />
  );
}
