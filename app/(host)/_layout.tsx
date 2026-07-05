import i18n from '@/i18n';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { useLanguage } from '@/components/LanguageProvider';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';

export default function HostLayout() {
    const colorScheme = useColorScheme();
    const { locale } = useLanguage();
    const { user, activeRole } = useAuthStore();

    // Routing is managed securely in app/_layout.tsx

    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                title: route.name === 'dashboard' ? i18n.t('host_tab_dashboard')
                    : route.name === 'reservations' ? i18n.t('host_tab_reservations')
                        : route.name === 'chat' ? i18n.t('chat_title')
                            : route.name === 'profile' ? i18n.t('host_tab_profile')
                                : undefined,
            })}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
                }}
            />

            <Tabs.Screen
                name="reservations"
                options={{
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="listings"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    href: null,
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
