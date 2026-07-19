import { AppFonts, CardShadow } from '@/constants/theme';
import { BackButton } from '@/components/ui/BackButton';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Booking, BookingService } from '@/lib/bookingService';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PeriodTab = 'thisMonth' | 'lastMonth' | 'allTime';

export default function EarningsScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState<PeriodTab>('thisMonth');

  const fetchBookings = async (isRefreshing = false) => {
    if (!user) return;
    if (!isRefreshing) setIsLoading(true);
    try {
      const data = await BookingService.getHostBookings(user.uid, { forceRefresh: isRefreshing });
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch earnings data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings(true);
  }, [user]);

  // --- Calculations ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const completedBookings = bookings.filter(b => b.status === 'completed');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

  const getMonthBookings = (month: number, year: number) =>
    completedBookings.filter(b => {
      const d = new Date(b.startDate);
      return d.getMonth() === month && d.getFullYear() === year;
    });

  const thisMonthCompleted = getMonthBookings(currentMonth, currentYear);
  const lastMonthCompleted = getMonthBookings(lastMonth, lastMonthYear);

  const thisMonthEarnings = thisMonthCompleted.reduce((sum, b) => sum + b.totalPrice, 0);
  const lastMonthEarnings = lastMonthCompleted.reduce((sum, b) => sum + b.totalPrice, 0);
  const allTimeEarnings = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Expected from confirmed but not completed
  const expectedEarnings = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Which transactions to show based on the active period tab
  const filteredTransactions = (() => {
    if (activePeriod === 'thisMonth') return thisMonthCompleted;
    if (activePeriod === 'lastMonth') return lastMonthCompleted;
    return completedBookings;
  })();

  const activeEarnings = (() => {
    if (activePeriod === 'thisMonth') return thisMonthEarnings;
    if (activePeriod === 'lastMonth') return lastMonthEarnings;
    return allTimeEarnings;
  })();

  const currentMonthLabel = now.toLocaleString(i18n.locale || 'en-US', { month: 'long' });
  const lastMonthLabel = new Date(lastMonthYear, lastMonth).toLocaleString(i18n.locale || 'en-US', { month: 'long' });

  // --- Service Revenue Breakdown ---
  // Deterministic color hashing so "boarding" always gets the same unique color
  const getServiceColor = (serviceStr: string) => {
    if (!serviceStr) return c.textMuted;
    let hash = 0;
    for (let i = 0; i < serviceStr.length; i++) {
      hash = serviceStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`; // Vibrant but soft
  };

  const serviceRevenue = (() => {
    const source = activePeriod === 'thisMonth' ? thisMonthCompleted
      : activePeriod === 'lastMonth' ? lastMonthCompleted
        : completedBookings;

    const map: Record<string, number> = {};
    source.forEach(b => {
      const key = (b.serviceType || 'other').toLowerCase();
      map[key] = (map[key] || 0) + b.totalPrice;
    });

    return Object.entries(map)
      .map(([service, total]) => ({ service, total }))
      .sort((a, b) => b.total - a.total);
  })();

  const maxServiceRevenue = serviceRevenue.length > 0
    ? Math.max(...serviceRevenue.map(s => s.total))
    : 1;

  const renderTransaction = ({ item }: { item: Booking }) => {
    const date = new Date(item.startDate);
    const dateStr = date.toLocaleDateString(i18n.locale || 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const svcColor = getServiceColor((item.serviceType || '').toLowerCase());

    return (
      <View style={[styles.transactionRow, { borderBottomColor: c.border, paddingHorizontal: 20 }]}>
        <View style={[styles.transactionIcon, { backgroundColor: svcColor + '18' }]}>
          <Ionicons name="checkmark-circle" size={22} color={svcColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.transactionName, { color: c.text }]} numberOfLines={1}>
            {item.guestName || i18n.t('earnings_guest', { defaultValue: 'Guest' })}
          </Text>
          <Text style={[styles.transactionMeta, { color: c.textMuted }]}>
            {item.serviceType ? i18n.t(`service_${item.serviceType}`, { defaultValue: item.serviceType }) : ''} — {dateStr}
          </Text>
        </View>
        <Text style={[styles.transactionAmount, { color: c.text }]}>
          +{item.totalPrice} MAD
        </Text>
      </View>
    );
  };

  const ListHeader = () => (
    <>
      {/* Balance Section */}
      <View style={[styles.balanceCard, { backgroundColor: c.bg2 }]}>
        <Text style={[styles.balanceLabel, { color: c.textMuted }]}>
          {i18n.t('earnings_total_balance', { defaultValue: 'Total Earned' })}
        </Text>
        <Text style={[styles.balanceValue, { color: c.text }]}>
          {allTimeEarnings.toLocaleString()} MAD
        </Text>
        {expectedEarnings > 0 && (
          <View style={styles.expectedRow}>
            <Ionicons name="time-outline" size={14} color={c.textMuted} />
            <Text style={[styles.expectedText, { color: c.textMuted }]}>
              +{expectedEarnings.toLocaleString()} MAD {i18n.t('earnings_expected', { defaultValue: 'expected' })}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.payoutButton, { backgroundColor: c.primary + '15' }]}
          onPress={() => Alert.alert(
            i18n.t('earnings_payout_title', { defaultValue: 'Payouts' }),
            i18n.t('earnings_payout_coming_soon', { defaultValue: 'Payout integration is coming soon! You will be able to withdraw your earnings directly to your bank account.' })
          )}
        >
          <Ionicons name="wallet-outline" size={18} color={c.primary} />
          <Text style={[styles.payoutButtonText, { color: c.primary }]}>
            {i18n.t('earnings_withdraw', { defaultValue: 'Withdraw Payout' })}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {/* Monthly Comparison */}
        <View style={styles.comparisonRow}>
          <View style={[styles.comparisonCard, { backgroundColor: c.bg2 }]}>
            <Text style={[styles.comparisonLabel, { color: c.textMuted }]}>{currentMonthLabel}</Text>
            <Text style={[styles.comparisonValue, { color: c.text }]}>{thisMonthEarnings.toLocaleString()} MAD</Text>
            <Text style={[styles.comparisonSub, { color: c.textMuted }]}>
              {thisMonthCompleted.length} {i18n.t('earnings_bookings', { defaultValue: 'bookings' })}
            </Text>
          </View>
          <View style={[styles.comparisonCard, { backgroundColor: c.bg2 }]}>
            <Text style={[styles.comparisonLabel, { color: c.textMuted }]}>{lastMonthLabel}</Text>
            <Text style={[styles.comparisonValue, { color: c.text }]}>{lastMonthEarnings.toLocaleString()} MAD</Text>
            <Text style={[styles.comparisonSub, { color: c.textMuted }]}>
              {lastMonthCompleted.length} {i18n.t('earnings_bookings', { defaultValue: 'bookings' })}
            </Text>
          </View>
        </View>

        {/* Revenue by Service Chart */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          {i18n.t('earnings_by_service', { defaultValue: 'Revenue by Service' })}
        </Text>
        <View style={[styles.chartCard, { backgroundColor: c.bg2 }]}>
          {serviceRevenue.length === 0 ? (
            <Text style={[styles.chartEmpty, { color: c.textMuted }]}>
              {i18n.t('earnings_no_service_data', { defaultValue: 'No service data for this period' })}
            </Text>
          ) : (
            serviceRevenue.map(({ service, total }) => {
              const barColor = getServiceColor(service);
              const barWidth = (total / maxServiceRevenue) * 100;
              const label = i18n.t(`service_${service}`, { defaultValue: service.charAt(0).toUpperCase() + service.slice(1) });

              return (
                <View key={service} style={styles.chartRow}>
                  <View style={styles.chartLabelRow}>
                    <View style={[styles.chartDot, { backgroundColor: barColor }]} />
                    <Text style={[styles.chartLabel, { color: c.text }]}>{label}</Text>
                    <Text style={[styles.chartAmount, { color: c.textMuted }]}>{total.toLocaleString()} MAD</Text>
                  </View>
                  <View style={[styles.chartBarBg, { backgroundColor: c.bg }]}>
                    <View style={[styles.chartBarFill, { backgroundColor: barColor, width: `${Math.max(barWidth, 4)}%` }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Period Tabs */}
        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 8 }]}>
          {i18n.t('earnings_history', { defaultValue: 'Transaction History' })}
        </Text>
        <View style={styles.periodTabs}>
          {(['thisMonth', 'lastMonth', 'allTime'] as PeriodTab[]).map(tab => {
            const isActive = activePeriod === tab;
            const labels: Record<PeriodTab, string> = {
              thisMonth: currentMonthLabel,
              lastMonth: lastMonthLabel,
              allTime: i18n.t('earnings_all_time', { defaultValue: 'All Time' }),
            };
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActivePeriod(tab)}
                style={[
                  styles.periodTab,
                  { backgroundColor: isActive ? c.primary : c.bg2 },
                ]}
              >
                <Text style={[
                  styles.periodTabText,
                  { color: isActive ? '#fff' : c.textMuted },
                ]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Earnings for selected period */}
        <View style={[styles.periodSummary, { backgroundColor: c.bg2 }]}>
          <Text style={[styles.periodSummaryLabel, { color: c.textMuted }]}>
            {i18n.t('earnings_period_total', { defaultValue: 'Period total' })}
          </Text>
          <Text style={[styles.periodSummaryValue, { color: c.text }]}>
            {activeEarnings.toLocaleString()} MAD
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.bg2 }]}>
        <BackButton style={styles.backBtn} icon="arrow-back" />
        <Text style={[styles.headerTitle, { color: c.text }]}>
          {i18n.t('earnings_title', { defaultValue: 'Earnings & Payouts' })}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id!}
        renderItem={renderTransaction}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={56} color={c.textMuted} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              {i18n.t('earnings_no_transactions', { defaultValue: 'No transactions for this period' })}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: AppFonts.bodyBold,
  },
  listContent: {
    paddingBottom: 40,
  },
  // Balance Card
  balanceCard: {

    padding: 28,
    paddingTop: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: AppFonts.body,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 36,
    fontFamily: AppFonts.title,
    color: '#fff',
    marginBottom: 8,
  },
  expectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  expectedText: {
    fontSize: 13,
    fontFamily: AppFonts.body,
    color: 'rgba(255,255,255,0.7)',
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  payoutButtonText: {
    fontSize: 15,
    fontFamily: AppFonts.bodyBold,
  },
  // Comparison Cards
  comparisonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  comparisonCard: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
    ...CardShadow,
  },
  comparisonLabel: {
    fontSize: 13,
    fontFamily: AppFonts.body,
    textTransform: 'capitalize',
  },
  comparisonValue: {
    fontSize: 22,
    fontFamily: AppFonts.bodyBold,
  },
  comparisonSub: {
    fontSize: 12,
    fontFamily: AppFonts.body,
  },
  // Section
  sectionTitle: {
    fontSize: 20,
    fontFamily: AppFonts.bodyBold,
    marginBottom: 14,
  },
  // Period Tabs
  periodTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  periodTabText: {
    fontSize: 13,
    fontFamily: AppFonts.bodyBold,
    textTransform: 'capitalize',
  },
  // Period Summary
  periodSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  periodSummaryLabel: {
    fontSize: 14,
    fontFamily: AppFonts.body,
  },
  periodSummaryValue: {
    fontSize: 20,
    fontFamily: AppFonts.bodyBold,
  },
  // Transactions
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionName: {
    fontSize: 15,
    fontFamily: AppFonts.bodyBold,
    marginBottom: 2,
  },
  transactionMeta: {
    fontSize: 12,
    fontFamily: AppFonts.body,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: AppFonts.bodyBold,
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: AppFonts.body,
    textAlign: 'center',
  },
  // Chart
  chartCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    gap: 16,
    ...CardShadow,
  },
  chartEmpty: {
    fontSize: 14,
    fontFamily: AppFonts.body,
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartRow: {
    gap: 8,
  },
  chartLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: AppFonts.bodyBold,
    textTransform: 'capitalize',
  },
  chartAmount: {
    fontSize: 13,
    fontFamily: AppFonts.body,
  },
  chartBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
