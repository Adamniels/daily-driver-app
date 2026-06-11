import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '@/lib/auth';
import { palette } from '@/theme/colors';

function TabEmoji({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text className={`text-xl ${focused ? '' : 'opacity-40'}`}>{emoji}</Text>;
}

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
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🐣" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="✅" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
