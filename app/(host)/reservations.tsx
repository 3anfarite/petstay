import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Booking, BookingService } from '@/lib/bookingService';
import { ChatService } from '@/lib/chatService';
import { NotificationService } from '@/lib/notificationService';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SkeletonView = ({ width, height, borderRadius, style }: any) => {
  const c = useColors();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[{ width, height, borderRadius: borderRadius || 8, backgroundColor: c.border, opacity }, style]} />;
};

const BookingSkeleton = () => {
  const c = useColors();
  return (
    <View style={[skeletonStyles.card, { backgroundColor: c.bg2 }]}>
      <SkeletonView width={80} height={24} borderRadius={12} />
      <View style={{ gap: 8, marginTop: 16 }}>
        <SkeletonView width="70%" height={20} />
        <SkeletonView width="50%" height={16} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <SkeletonView width="45%" height={56} borderRadius={12} />
        <SkeletonView width="45%" height={56} borderRadius={12} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        <SkeletonView width="30%" height={16} />
        <SkeletonView width="20%" height={16} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <SkeletonView width="100%" height={44} borderRadius={14} />
      </View>
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  }
});

type TabType = 'upcoming' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  pending: { icon: 'time-outline', color: '#F59E0B', bg: '#FEF3C7' },
  confirmed: { icon: 'checkmark-circle-outline', color: '#1E8E3E', bg: '#E6F4EA' },
  completed: { icon: 'checkmark-done-outline', color: '#6B7280', bg: '#F3F4F6' },
  cancelled: { icon: 'close-circle-outline', color: '#D93025', bg: '#FCE8E6' },
  declined: { icon: 'close-circle-outline', color: '#D93025', bg: '#FCE8E6' },
};

export default function HostReservationsScreen() {
  const c = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const fetchBookings = async (isRefreshing = false) => {
    if (!user) return;
    if (!isRefreshing) setIsLoading(true);
    try {
      const data = await BookingService.getHostBookings(user.uid);
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings(true);
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const hasAlertedRef = React.useRef(false);

  useEffect(() => {
    if (bookings.length > 0 && !hasAlertedRef.current) {
      let foundOverlap = false;
      const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');

      for (let i = 0; i < pendingBookings.length; i++) {
        for (let j = i + 1; j < pendingBookings.length; j++) {
          const start1 = new Date(pendingBookings[i].startDate).getTime();
          const end1 = new Date(pendingBookings[i].endDate).getTime();
          const start2 = new Date(pendingBookings[j].startDate).getTime();
          const end2 = new Date(pendingBookings[j].endDate).getTime();

          if (start1 < end2 && end1 > start2) {
            foundOverlap = true;
            break;
          }
        }
        if (foundOverlap) break;
      }

      if (foundOverlap) {
        hasAlertedRef.current = true;
        // Trigger local notification/alert
        NotificationService.sendLocalNotification(
          i18n.t('booking_overlap_notif_title', { defaultValue: "⚠️ Double Booking Warning" }),
          i18n.t('booking_overlap_notif_body', { defaultValue: "You have overlapping booking requests. Please check your capacity!" })
        );
        Alert.alert(
          i18n.t('booking_overlap_alert_title', { defaultValue: "Overlapping Bookings Detected" }),
          i18n.t('booking_overlap_alert_body', { defaultValue: "You have received booking requests that overlap in time. Please check the highlighted red cards and ensure you have enough capacity before accepting." })
        );
      }
    }
  }, [bookings]);

  const handleUpdateStatus = (bookingId: string, status: 'confirmed' | 'declined' | 'cancelled', hasOverlap?: boolean) => {
    const titles = {
      confirmed: 'Accept Booking',
      declined: 'Decline Booking',
      cancelled: 'Cancel Booking'
    };
    const messages = {
      confirmed: 'Are you sure you want to accept this booking request?',
      declined: 'Are you sure you want to decline this booking request?',
      cancelled: 'Are you sure you want to cancel this confirmed booking?'
    };

    Alert.alert(
      titles[status],
      messages[status],
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: status === 'confirmed' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const bookingToUpdate = bookings.find(b => b.id === bookingId);
              const dbStatus = status === 'declined' ? 'cancelled' : status;

              await BookingService.updateBookingStatus(bookingId, dbStatus);
              setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: dbStatus } : b));

              // If declining, send an automated message
              if (status === 'declined' && bookingToUpdate && user) {
                const dateStr = new Date(bookingToUpdate.startDate).toLocaleDateString();
                let declineMsg = i18n.t('booking_decline_normal_msg', { 
                  defaultValue: `Hello ${bookingToUpdate.guestName}, unfortunately I have to decline your booking request for ${dateStr}. I'm sorry for the inconvenience!`,
                  name: bookingToUpdate.guestName,
                  date: dateStr
                });
                
                if (hasOverlap) {
                  declineMsg = i18n.t('booking_decline_overlap_msg', { 
                    defaultValue: `Hello ${bookingToUpdate.guestName}, unfortunately I have to decline your booking request for ${dateStr} because this time slot has already been booked. I'm sorry for the inconvenience!`,
                    name: bookingToUpdate.guestName,
                    date: dateStr
                  });
                }

                await ChatService.startChatAndSendMessage(
                  user.uid,
                  bookingToUpdate.guestId,
                  bookingToUpdate.hostName,
                  bookingToUpdate.guestName,
                  user.photoURL || '',
                  bookingToUpdate.guestAvatar || '',
                  declineMsg
                );
              }
            } catch (error) {
              console.error('Failed to update booking:', error);
              Alert.alert(i18n.t('error_title', { defaultValue: 'Error' }), i18n.t('error_booking_update', { defaultValue: 'Could not update the booking. Please try again.' }));
            }
          }
        }
      ]
    );
  };

  // Filter bookings based on active tab and status mappings
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') return b.status === 'pending' || b.status === 'confirmed';
    if (activeTab === 'cancelled') return b.status === 'cancelled' || b.status === 'declined';
    return b.status === activeTab;
  });

  const handleTabChange = (tab: TabType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const renderReservationCard = ({ item }: { item: Booking }) => {
    const startD = new Date(item.startDate);
    const startStr = startD.toLocaleDateString(i18n.locale || 'en-US', { month: 'short', day: 'numeric' });

    const isHourly = ['grooming', 'walking', 'training', 'vets'].includes((item.serviceType || '').toLowerCase());
    let endLabel = '';
    let endValue = '';

    if (isHourly) {
      endLabel = i18n.t('booking_time', { defaultValue: 'Time' });
      endValue = startD.toLocaleTimeString(i18n.locale || 'en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      endLabel = i18n.t('booking_checkout', { defaultValue: 'Check-out' });
      endValue = new Date(item.endDate).toLocaleDateString(i18n.locale || 'en-US', { month: 'short', day: 'numeric' });
    }

    const isPending = item.status === 'pending';
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const serviceLabel = item.serviceType ? i18n.t(`service_${item.serviceType}`, { defaultValue: item.serviceType }) : '';

    const hasOverlap = (() => {
      if (item.status !== 'pending' && item.status !== 'confirmed') return false;
      const itemStart = new Date(item.startDate).getTime();
      const itemEnd = new Date(item.endDate).getTime();

      return bookings.some(b => {
        if (b.id === item.id) return false;
        if (b.status !== 'pending' && b.status !== 'confirmed') return false;
        const bStart = new Date(b.startDate).getTime();
        const bEnd = new Date(b.endDate).getTime();
        return itemStart < bEnd && itemEnd > bStart;
      });
    })();

    return (
      <View style={[
        styles.card,
        {
          backgroundColor: hasOverlap ? '#FEF2F2' : c.bg2,
          borderColor: hasOverlap ? '#EF4444' : 'transparent',
        }
      ]}>
        {/* Status Pill */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasOverlap ? 12 : 0 }}>
          <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {i18n.t(`booking_status_${item.status}`)}
            </Text>
          </View>
        </View>

        {/* Prominent Overlap Banner */}
        {hasOverlap && (
          <View style={{
            backgroundColor: '#FEE2E2',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderLeftWidth: 4,
            borderLeftColor: '#EF4444'
          }}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#DC2626', fontFamily: AppFonts.bodyBold, fontSize: 13, marginBottom: 2 }}>
                {i18n.t('booking_overlap_banner_title', { defaultValue: 'Double Booking Warning' })}
              </Text>
              <Text style={{ color: '#DC2626', fontFamily: AppFonts.body, fontSize: 12 }}>
                {i18n.t('booking_overlap_banner_body', { defaultValue: 'This request overlaps with another reservation. Please check your capacity before accepting.' })}
              </Text>
            </View>
          </View>
        )}

        {/* Guest + Service */}
        <View style={styles.mainInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color={c.primary} />
            <Text style={[styles.serviceTitle, { color: c.text }]} numberOfLines={1}>
              {item.guestName || 'Guest'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="paw" size={16} color={c.textMuted} />
            <Text style={[styles.locationText, { color: c.textMuted }]} numberOfLines={1}>
              {item.pets && item.pets.length > 0 ? item.pets.map(p => p.name).join(', ') : item.petType} — {serviceLabel}
            </Text>
          </View>
        </View>

        {/* Date Chips */}
        <View style={styles.dateChipsRow}>
          <View style={[styles.dateChip, { backgroundColor: c.bg }]}>
            <Text style={[styles.dateChipLabel, { color: c.textMuted }]}>
              {isHourly ? i18n.t('booking_date', { defaultValue: 'Date' }) : i18n.t('booking_checkin', { defaultValue: 'Check-in' })}
            </Text>
            <Text style={[styles.dateChipValue, { color: c.text }]}>{startStr}</Text>
          </View>
          <View style={[styles.dateChipDivider, { backgroundColor: c.border }]} />
          <View style={[styles.dateChip, { backgroundColor: c.bg }]}>
            <Text style={[styles.dateChipLabel, { color: c.textMuted }]}>{endLabel}</Text>
            <Text style={[styles.dateChipValue, { color: c.text }]}>{endValue}</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.metaRow}>
          <Text style={[styles.price, { color: c.text }]}>
            {item.totalPrice} MAD <Text style={[styles.priceLabel, { color: c.textMuted }]}>{i18n.t('booking_total_lower', { defaultValue: 'total' })}</Text>
          </Text>
          {item.petType && (
            <View style={styles.infoRow}>
              <Ionicons name="paw-outline" size={14} color={c.textMuted} />
              <Text style={[styles.petType, { color: c.textMuted }]}>{item.petType}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsColumn}>
          {/* Message button always visible */}
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: c.primary }]}
            onPress={() => router.push({
              pathname: '/chat/[id]',
              params: { id: item.guestId, name: item.guestName || 'Guest', avatar: item.guestAvatar }
            })}
          >
            <Ionicons name="chatbubble-outline" size={16} color="white" />
            <Text style={styles.primaryActionText}>{i18n.t('host_action_message', { defaultValue: 'Message Guest' })}</Text>
          </TouchableOpacity>

          {/* Accept / Decline for pending */}
          {isPending && (
            <View style={styles.decisionRow}>
              <TouchableOpacity
                style={[styles.acceptAction, { backgroundColor: '#1E8E3E' }]}
                onPress={() => item.id && handleUpdateStatus(item.id, 'confirmed')}
              >
                <Ionicons name="checkmark" size={18} color="white" />
                <Text style={styles.primaryActionText}>{i18n.t('host_action_accept', { defaultValue: 'Accept' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryAction, { borderColor: '#D93025' }]}
                onPress={() => item.id && handleUpdateStatus(item.id, 'declined', hasOverlap)}
              >
                <Text style={[styles.secondaryActionText, { color: '#D93025' }]}>{i18n.t('host_action_decline', { defaultValue: 'Decline' })}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cancel for confirmed */}
          {item.status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.secondaryAction, { borderColor: c.border }]}
              onPress={() => item.id && handleUpdateStatus(item.id, 'cancelled')}
            >
              <Text style={[styles.secondaryActionText, { color: c.text }]}>{i18n.t('host_action_cancel_booking', { defaultValue: 'Cancel Booking' })}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{i18n.t('host_reservations_title')}</Text>
        <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>
          {i18n.t(filteredBookings.length === 1 ? 'bookings_count_subtitle_one' : 'bookings_count_subtitle_other', {
            count: filteredBookings.length,
            status: i18n.t(`bookings_tab_${activeTab}`).toLowerCase()
          })}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['upcoming', 'completed', 'cancelled'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, { backgroundColor: c.bg }, activeTab === tab && [styles.activeTab, { backgroundColor: c.primary }]]}
            onPress={() => handleTabChange(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText, { color: c.textMuted },
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {i18n.t(`bookings_tab_${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.listContent}>
          <BookingSkeleton />
          <BookingSkeleton />
          <BookingSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id!}
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
              <Ionicons name="calendar-clear-outline" size={64} color={c.textMuted} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyTitle, { color: c.textMuted }]}>
                No {activeTab} reservations
              </Text>
            </View>
          }
          renderItem={renderReservationCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: AppFonts.title,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: AppFonts.body,
    textTransform: 'capitalize',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  activeTab: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontFamily: AppFonts.bodyBold,
  },
  activeTabText: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  // Card
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontFamily: AppFonts.bodyBold,
    textTransform: 'capitalize',
  },
  mainInfo: {
    gap: 6,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceTitle: {
    fontSize: 17,
    fontFamily: AppFonts.bodyBold,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontFamily: AppFonts.body,
    flex: 1,
  },
  dateChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 16,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  dateChipLabel: {
    fontSize: 11,
    fontFamily: AppFonts.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateChipValue: {
    fontSize: 16,
    fontFamily: AppFonts.bodyBold,
  },
  dateChipDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 17,
    fontFamily: AppFonts.bodyBold,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: AppFonts.body,
  },
  petType: {
    fontSize: 13,
    fontFamily: AppFonts.body,
  },
  actionsColumn: {
    gap: 12,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  primaryActionText: {
    color: 'white',
    fontFamily: AppFonts.bodyBold,
    fontSize: 14,
  },
  acceptAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
  },
  secondaryAction: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontFamily: AppFonts.bodyBold,
    fontSize: 14,
  },
  // Empty State
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: AppFonts.bodyBold,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
});
