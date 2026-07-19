import { useLanguage } from '@/components/LanguageProvider';
import { AppFonts, CardShadow } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { BookingService } from '@/lib/bookingService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export default function HostDashboard() {
    const c = useColors();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { locale } = useLanguage(); // Force re-render on language change
    const [refreshing, setRefreshing] = useState(false);
    const scrollRef = useRef(null);
    useScrollToTop(scrollRef);
    
    const [rating, setRating] = useState<string>('-');
    const [earnings, setEarnings] = useState<number>(0);
    const { user } = useAuthStore();
    const currentMonthName = new Date().toLocaleString(i18n.locale || 'en-US', { month: 'short' });

    const fetchData = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.rating) {
                    setRating(typeof data.rating === 'number' ? data.rating.toFixed(2) : data.rating);
                } else {
                    setRating('New');
                }
            }

            const bookings = await BookingService.getHostBookings(user.uid);
            let monthEarnings = 0;
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            bookings.forEach(b => {
                if (b.status === 'completed' || b.status === 'confirmed') {
                    const d = new Date(b.startDate);
                    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                        monthEarnings += b.totalPrice;
                    }
                }
            });
            setEarnings(monthEarnings);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [user]);

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

                <View style={styles.statsContainer}>
                    <TouchableOpacity 
                        style={[styles.statCard, { backgroundColor: c.bg2 }]}
                        onPress={() => router.push('/(host)/earnings')}
                        activeOpacity={0.7}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="wallet-outline" size={24} color={c.primary} />
                            <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
                        </View>
                        <Text style={[styles.statValue, { color: c.text }]}>{earnings.toLocaleString()} MAD</Text>
                        <Text style={[styles.statLabel, { color: c.textMuted }]}>{i18n.t('host_dashboard_earnings', { month: currentMonthName })}</Text>
                    </TouchableOpacity>
                    <View style={[styles.statCard, { backgroundColor: c.bg2 }]}>
                        <Ionicons name="star-outline" size={24} color={c.primary} />
                        <Text style={[styles.statValue, { color: c.text }]}>{rating}</Text>
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
        borderRadius: 24,
        alignItems: 'center',
        gap: 8,
        ...CardShadow,
    },
    statValue: {
        fontSize: 24,
        fontFamily: AppFonts.bodyBold,
    },
    statLabel: {
        fontSize: 14,
        fontFamily: AppFonts.body,
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
        borderRadius: 20,
        padding: 20,
        ...CardShadow,
        marginBottom: 24,
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
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        gap: 16,
        ...CardShadow,
        marginBottom: 24,
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
