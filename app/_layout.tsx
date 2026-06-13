import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LanguageProvider } from '@/components/LanguageProvider';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { useAuthStore } from '@/store/useAuthStore';
import { NotificationService } from '@/lib/notificationService';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh time
      gcTime: 1000 * 60 * 30, // 30 minutes in cache
    },
  },
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
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

  // Register for notifications when user logs in
  useEffect(() => {
    if (user) {
      NotificationService.registerForPushNotificationsAsync(user.uid);
    }
  }, [user]);

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

  const isRouting = useRef(false);

  const handleInitialRoute = async () => {
    if (isRouting.current) return;
    isRouting.current = true;

    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      const inAuthGroup = segments[0] === 'auth';
      const inTabsGroup = segments[0] === '(tabs)';
      const inHostGroup = segments[0] === '(host)';
      const inOnboardingGroup = segments[0] === 'onboarding';
      const currentPath = segments.join('/');

      if (!user) {
        // No session: Go to onboarding or welcome
        if (hasSeenOnboarding) {
          if (!inAuthGroup) {
            router.replace('/auth/welcome');
          }
        } else {
          if (!inOnboardingGroup) {
            router.replace('/onboarding');
          }
        }
      } else {
        // Session exists: Route based on their active role toggle
        if (activeRole === 'unassigned') {
          if (currentPath !== 'auth/role-selection') {
            router.replace('/auth/role-selection');
          }
        } else if (activeRole === 'host') {
          if (!inHostGroup) {
            router.replace('/(host)/dashboard'); // Assuming dashboard is the default host screen
          }
        } else {
          if (!inTabsGroup) {
            router.replace('/(tabs)');
          }
        }
      }
    } catch (e) {
      console.error('Routing error:', e);
    } finally {
      // Small delay to allow Expo Router animations to complete before unlocking
      setTimeout(() => {
        isRouting.current = false;
      }, 500);
    }
  };

  if (!loaded || !fontsLoaded || isLoading) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(host)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="host/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="host-profile/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
