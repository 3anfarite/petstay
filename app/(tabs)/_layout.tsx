import i18n from '@/i18n';
import { Tabs, Redirect } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { useLanguage } from '@/components/LanguageProvider';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { locale } = useLanguage();
  const { user, activeRole } = useAuthStore();

  // Instant declarative routing guards to physically prevent FOUC screen flashing
  if (!user) return <Redirect href="/auth/welcome" />;
  if (activeRole === 'host') return <Redirect href="/(host)/dashboard" />;
  if (activeRole === 'unassigned') return <Redirect href="/auth/role-selection" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        title: route.name === 'index' ? i18n.t('tab_home')
          : route.name === 'bookings' ? i18n.t('tab_bookings')
            : route.name === 'wishlist' ? i18n.t('tab_wishlist')
              : route.name === 'chat' ? i18n.t('tab_chat')
                : route.name === 'profile' ? i18n.t('tab_profile')
                  : undefined,
      })}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}