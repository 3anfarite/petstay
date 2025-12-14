import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HostDashboard() {
    const c = useColors();
    const insets = useSafeAreaInsets();

    // Fallback for primaryLight until theme is updated
    const primaryLight = c.primary + '20'; // 20% opacity

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_dashboard_title')}</Text>
                    <Text style={[styles.subtitle, { color: c.textMuted }]}>{i18n.t('host_dashboard_welcome')}</Text>
                </View>

                {/* Stats Cards */}
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: c.bg }]}>
                        <Ionicons name="wallet-outline" size={24} color={c.primary} />
                        <Text style={[styles.statValue, { color: c.text }]}>$1,240</Text>
                        <Text style={[styles.statLabel, { color: c.textMuted }]}>{i18n.t('host_dashboard_earnings')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: c.bg }]}>
                        <Ionicons name="star-outline" size={24} color={c.primary} />
                        <Text style={[styles.statValue, { color: c.text }]}>4.92</Text>
                        <Text style={[styles.statLabel, { color: c.textMuted }]}>{i18n.t('host_dashboard_rating')}</Text>
                    </View>
                </View>

                {/* Recent Activity Mock */}
                <Text style={[styles.sectionTitle, { color: c.text }]}>{i18n.t('host_dashboard_activity')}</Text>

                <View style={{ gap: 16 }}>
                    <View style={[styles.activityCard, { backgroundColor: c.bg2 }]}>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&h=100&fit=crop' }}
                                style={styles.petImage}
                            />
                            <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={[styles.activityTitle, { color: c.text }]}>{i18n.t('host_activity_new_reservation')}</Text>
                                    <View style={[styles.badge, { backgroundColor: c.primary + '20' }]}>
                                        <Text style={[styles.badgeText, { color: c.primary }]}>Nov 28</Text>
                                    </View>
                                </View>
                                <Text style={[styles.activityDesc, { color: c.textMuted }]}>Alex • Dec 20-24</Text>
                                <Text style={[styles.activityPrice, { color: c.text }]}>$120 total</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.activityCard, { backgroundColor: c.bg2 }]}>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop' }}
                                style={styles.petImage}
                            />
                            <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={[styles.activityTitle, { color: c.text }]}>{i18n.t('host_activity_new_review')}</Text>
                                    <View style={[styles.badge, { backgroundColor: '#FF980020' }]}>
                                        <Text style={[styles.badgeText, { color: '#FF9800' }]}>Nov 25</Text>
                                    </View>
                                </View>
                                <Text style={[styles.activityDesc, { color: c.textMuted }]}>Sarah left 5 stars!</Text>
                                <Text style={[styles.activityPrice, { color: c.text }]}>"Great host, very kind..."</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Host Tips */}
                <Text style={[styles.sectionTitle, { color: c.text, marginTop: 32 }]}>{i18n.t('host_dashboard_tips')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    <TouchableOpacity style={[styles.tipCard, { backgroundColor: c.bg }]}>
                        <View style={[styles.tipIcon, { backgroundColor: '#E0F7FA' }]}>
                            <Ionicons name="calendar-outline" size={24} color="#00BCD4" />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={[styles.tipTitle, { color: c.text }]}>{i18n.t('host_tip_update_calendar')}</Text>
                            <Text style={[styles.tipDesc, { color: c.textMuted }]}>{i18n.t('host_tip_update_calendar_desc')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tipCard, { backgroundColor: c.bg }]}>
                        <View style={[styles.tipIcon, { backgroundColor: '#FCE4EC' }]}>
                            <Ionicons name="flash-outline" size={24} color="#E91E63" />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={[styles.tipTitle, { color: c.text }]}>{i18n.t('host_tip_boost_listing')}</Text>
                            <Text style={[styles.tipDesc, { color: c.textMuted }]}>{i18n.t('host_tip_boost_listing_desc')}</Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
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
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
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
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    activityCard: {
        padding: 12,
        borderRadius: 16,
    },
    petImage: {
        width: 72,
        height: 72,
        borderRadius: 12,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    activityDesc: {
        fontSize: 13,
    },
    activityPrice: {
        fontSize: 12,
        fontWeight: '700',
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    // Action Card Styles
    actionCard: {
        width: 160,
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionDesc: {
        fontSize: 12,
    },
    // Tip Card Styles
    tipCard: {
        width: 260,
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 16,
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
        fontWeight: '600',
    },
    tipDesc: {
        fontSize: 13,
        maxWidth: 160,
    },
});
