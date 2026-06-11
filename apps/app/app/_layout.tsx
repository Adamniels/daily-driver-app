import '../global.css';
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Providers } from '@/lib/providers';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Providers>
      <StatusBar style="dark" />
      <Slot />
    </Providers>
  );
}
