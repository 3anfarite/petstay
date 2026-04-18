import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { LanguageProvider } from '@/components/LanguageProvider';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { useAuthStore } from '@/store/useAuthStore';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const loaded = navigationState?.key; // Check if navigation state is loaded using key

  const { user, isLoading, activeRole, initializeAuthListener } = useAuthStore();
  const splashHidden = useRef(false);

  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  // Start listening to Firebase Auth state as soon as the app boots
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded && fontsLoaded && !isLoading) {
      const initializeRouting = async () => {
        await handleInitialRoute();

        // Hide Splash screen strictly once, securely after routing computes
        if (!splashHidden.current) {
          setTimeout(() => {
            SplashScreen.hideAsync().catch(() => { });
          }, 400);
          splashHidden.current = true;
        }
      };
      initializeRouting();
    }
  }, [loaded, fontsLoaded, isLoading, user, activeRole]);

  const handleInitialRoute = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

      if (!user) {
        // No session: Go to onboarding or welcome
        if (hasSeenOnboarding) {
          router.replace('/auth/welcome');
        } else {
          router.replace('/onboarding');
        }
      } else {
        // Session exists: Route based on their active role toggle
        if (activeRole === 'unassigned') {
          router.replace('/auth/role-selection' as any);
        } else if (activeRole === 'host') {
          router.replace('/(host)/dashboard'); // Assuming dashboard is the default host screen
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (e) {
      console.error('Routing error:', e);
    }
  };

  if (!loaded || !fontsLoaded || isLoading) {
    return null;
  }

  return (
    <LanguageProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(host)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LanguageProvider>
  );
}
