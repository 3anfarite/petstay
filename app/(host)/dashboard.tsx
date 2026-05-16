import { useLanguage } from '@/components/LanguageProvider';
import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HostDashboard() {
    const c = useColors();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { locale } = useLanguage(); // Force re-render on language change
    const [refreshing, setRefreshing] = useState(false);
    const scrollRef = useRef(null);
    useScrollToTop(scrollRef);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Simulate network fetch
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // Fallback for primaryLight until theme is updated
    const primaryLight = c.primary + '20'; // 20% opacity

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_dashboard_title')}</Text>
                    <Text style={[styles.subtitle, { color: c.textMuted }]}>{i18n.t('host_dashboard_welcome')}</Text>
                </View>

                {/* Stats Cards */}
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: c.bg2 }]}>
                        <Ionicons name="wallet-outline" size={24} color={c.primary} />
                        <Text style={[styles.statValue, { color: c.text }]}>$1,240</Text>
                        <Text style={[styles.statLabel, { color: c.textMuted }]}>{i18n.t('host_dashboard_earnings')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: c.bg2 }]}>
                        <Ionicons name="star-outline" size={24} color={c.primary} />
                        <Text style={[styles.statValue, { color: c.text }]}>4.92</Text>
                        <Text style={[styles.statLabel, { color: c.textMuted }]}>{i18n.t('host_dashboard_rating')}</Text>
                    </View>
                </View>

                <View style={styles.actionGrid}>
                    <TouchableOpacity 
                        style={[styles.actionCard, { backgroundColor: c.bg2 }]}
                        onPress={() => router.push('/(host)/listings')}
                    >
                        <Ionicons name="list" size={28} color={c.primary} />
                        <View style={styles.actionTextContainer}>
                            <Text style={[styles.actionTitle, { color: c.text }]}>{i18n.t('host_dashboard_manage_listings')}</Text>
                            <Text style={[styles.actionDesc, { color: c.textMuted }]}>{i18n.t('host_dashboard_manage_listings_desc')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Host Tips */}
                <Text style={[styles.sectionTitle, { color: c.text, marginTop: 32 }]}>{i18n.t('host_dashboard_tips')}</Text>
                <View style={{ gap: 16 }}>
                    <TouchableOpacity
                        style={[styles.tipCard, { backgroundColor: c.bg2 }]}
                        onPress={() => router.push({ pathname: '/(host)/profile', params: { openVacation: 'true' } })}
                    >
                        <View style={[styles.tipIcon, { backgroundColor: '#E0F7FA' }]}>
                            <Ionicons name="calendar-outline" size={24} color="#00BCD4" />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={[styles.tipTitle, { color: c.text }]}>{i18n.t('host_tip_update_calendar')}</Text>
                            <Text style={[styles.tipDesc, { color: c.textMuted }]}>{i18n.t('host_tip_update_calendar_desc')}</Text>
                        </View>
                    </TouchableOpacity>
 
                    <TouchableOpacity style={[styles.tipCard, { backgroundColor: c.bg2 }]}>
                        <View style={[styles.tipIcon, { backgroundColor: '#FCE4EC' }]}>
                            <Ionicons name="flash-outline" size={24} color="#E91E63" />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={[styles.tipTitle, { color: c.text }]}>{i18n.t('host_tip_boost_listing')}</Text>
                            <Text style={[styles.tipDesc, { color: c.textMuted }]}>{i18n.t('host_tip_boost_listing_desc')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        marginBottom: 8,
        fontFamily: AppFonts.title,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: AppFonts.body,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        gap: 8,
    },
    statValue: {
        fontSize: 24,
        fontFamily: AppFonts.bodyBold,
    },
    statLabel: {
        fontSize: 14,
        fontFamily: AppFonts.body,
    },
    statCard: {
        width: '48%',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 20,
        marginBottom: 16,
        fontFamily: AppFonts.bodyBold,
    },
    actionGrid: {
        marginTop: 8,
        marginBottom: 24,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    actionDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    // Tip Card Styles
    tipCard: {
        width: '100%',
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    tipIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipTitle: {
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    },
    tipDesc: {
        fontSize: 13,
        fontFamily: AppFonts.body,
    },
});
