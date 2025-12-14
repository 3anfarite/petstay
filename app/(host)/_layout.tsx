import i18n from '@/i18n';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { useLanguage } from '@/components/LanguageProvider';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HostLayout() {
    const colorScheme = useColorScheme();
    const { locale } = useLanguage();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
            }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: i18n.t('host_tab_dashboard'),
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
                }}
            />

            <Tabs.Screen
                name="reservations"
                options={{
                    title: i18n.t('host_tab_reservations'),
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: i18n.t('chat_title'),
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
                name="profile"
                options={{
                    title: i18n.t('host_tab_profile'),
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
                }}
            />
        </Tabs>
    );
}
