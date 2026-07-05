import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { BookingService, Booking } from '@/lib/bookingService';
import { ChatService } from '@/lib/chatService';
import { useAuthStore } from '@/store/useAuthStore';
import { AppFonts } from '@/constants/theme';
import {
  Alert,
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
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
  const { user } = useAuthStore();

  const fetchBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await BookingService.getHostBookings(user.uid);
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleUpdateStatus = (bookingId: string, status: 'confirmed' | 'declined' | 'cancelled') => {
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
                await ChatService.startChatAndSendMessage(
                  user.uid,
                  bookingToUpdate.guestId,
                  bookingToUpdate.hostName,
                  bookingToUpdate.guestName,
                  user.photoURL || '',
                  bookingToUpdate.guestAvatar || '',
                  `Hello ${bookingToUpdate.guestName}, unfortunately I have to decline your booking request for ${new Date(bookingToUpdate.startDate).toLocaleDateString()}. I'm sorry for the inconvenience!`
                );
              }
            } catch (error) {
              console.error('Failed to update booking:', error);
              Alert.alert('Error', 'Could not update the booking. Please try again.');
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

    return (
      <View style={[styles.card, { backgroundColor: c.bg2 }]}>
        {/* Status Pill */}
        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {i18n.t(`booking_status_${item.status}`)}
          </Text>
        </View>

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
                onPress={() => item.id && handleUpdateStatus(item.id, 'declined')}
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
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
