import { Redirect, Tabs } from 'expo-router';
import { BlobTabIcon, CheckTabIcon } from '@/components/TabIcons';
import { useAuth } from '@/lib/auth';
import { palette } from '@/theme/colors';

export default function MainLayout() {
  const { status } = useAuth();

  if (status === 'loading') return null;
  if (status === 'signedOut') return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.cream },
        tabBarActiveTintColor: palette.violet,
        tabBarInactiveTintColor: palette.inkSoft,
        tabBarLabelStyle: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#00000010' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <BlobTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color }) => <CheckTabIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
