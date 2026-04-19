import { dummyBookings, dummyHosts } from '@/constants/dummyData';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { BookingService, Booking } from '@/lib/bookingService';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Alert,
  Animated,
  FlatList,
  Image,
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
  return <Animated.View style={[{ width, height, borderRadius, backgroundColor: c.border, opacity }, style]} />;
};

const BookingSkeleton = () => {
  const c = useColors();
  const styles = makeStyles(c);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonView width={90} height={90} borderRadius={16} />
        <View style={[styles.cardInfo, { justifyContent: 'space-around' }]}>
          <View style={styles.topRow}>
            <SkeletonView width="50%" height={20} borderRadius={4} />
            <SkeletonView width={60} height={24} borderRadius={12} />
          </View>
          <SkeletonView width="40%" height={14} borderRadius={4} />
          <SkeletonView width="60%" height={14} borderRadius={4} />
          <SkeletonView width="30%" height={18} borderRadius={4} />
        </View>
      </View>
      <View style={styles.cardFooter}>
        <SkeletonView width="100%" height={45} borderRadius={14} />
      </View>
    </View>
  );
};

type TabType = 'upcoming' | 'completed' | 'cancelled';

export default function BookingScreen() {
  const c = useColors();
  const router = useRouter();
  const styles = makeStyles(c);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      try {
        const data = await BookingService.getGuestBookings(user.uid);
        setBookings(data);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      i18n.t('booking_cancel_title', { defaultValue: 'Cancel Booking' }),
      i18n.t('booking_cancel_message', { defaultValue: 'Are you sure you want to cancel this booking? This action cannot be undone.' }),
      [
        { text: i18n.t('booking_action_no', { defaultValue: 'No, Keep it' }), style: 'cancel' },
        {
          text: i18n.t('booking_action_yes', { defaultValue: 'Yes, Cancel' }),
          style: 'destructive',
          onPress: async () => {
            try {
              // Update strictly to Firebase first
              await BookingService.updateBookingStatus(bookingId, 'cancelled');
              
              // Optimistically cascade UI state so it instantly hops to the Cancelled Tab!
              setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
            } catch (error) {
              console.error('Failed to cancel booking:', error);
              Alert.alert('Error', 'Could not cancel the booking. Please try again.');
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('bookings_page_title')}</Text>
        <Text style={styles.headerSubtitle}>
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
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => handleTabChange(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="map-outline" size={48} color={c.primary} />
            </View>
            <Text style={styles.emptyTitle}>{i18n.t('bookings_empty_title')}</Text>
            <Text style={styles.emptySubtitle}>
              {i18n.t('bookings_empty_subtitle')}
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>
                {i18n.t('bookings_empty_btn')}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          // Fallback to dummy data for host visuals since we haven't stored them all strictly yet
          const host = dummyHosts.find((h) => h.id === item.hostId) || { image: 'https://placecats.com/100/100', location: 'Remote' };

          // Format ISO date safely
          const startStr = new Date(item.startDate).toLocaleDateString(i18n.locale || 'en-US', { month: 'short', day: 'numeric' });
          const endStr = new Date(item.endDate).toLocaleDateString(i18n.locale || 'en-US', { month: 'short', day: 'numeric' });
          const datesString = `${startStr} - ${endStr}`;
          
          const isUpcoming = item.status === 'pending' || item.status === 'confirmed';
          const isCancelled = item.status === 'cancelled' || item.status === 'declined';

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: host.image }} style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <View style={styles.topRow}>
                    <Text style={styles.hostName} numberOfLines={1}>{item.hostName || host.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      isUpcoming ? styles.badge_upcoming :
                        item.status === 'completed' ? styles.badge_completed :
                          styles.badge_cancelled
                    ]}>
                      <Text style={[
                        styles.statusText,
                        isUpcoming ? styles.text_upcoming :
                          item.status === 'completed' ? styles.text_completed :
                            styles.text_cancelled
                      ]}>
                        {i18n.t(`booking_status_${item.status}`)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="location-sharp" size={14} color={c.textMuted} />
                    <Text style={styles.location} numberOfLines={1}>{host.location}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-clear" size={14} color={c.textMuted} />
                    <Text style={styles.dates}>{datesString}</Text>
                  </View>

                  <Text style={styles.price}>${item.totalPrice} <Text style={styles.priceLabel}>{i18n.t('booking_total_lower')}</Text></Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.messageButton}>
                  <Text style={styles.messageText}>{i18n.t('booking_action_message')}</Text>
                </TouchableOpacity>

                {isUpcoming && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => item.id && handleCancelBooking(item.id)}
                  >
                    <Text style={styles.cancelText}>{i18n.t('booking_action_cancel')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
      )}
    </View>
  );
}

const makeStyles = (c: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg2, // Changed to match Home/Host screens (White)
      marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 24,
    },
    headerTitle: {
      fontSize: 34,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: c.textMuted,
      fontWeight: '500',
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
      backgroundColor: c.bg, // Gray background for inactive tabs to pop against White
      borderWidth: 0,
    },
    activeTab: {
      backgroundColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
    },
    activeTabText: {
      color: 'white',
      fontWeight: '700',
    },
    listContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
      gap: 24,
    },
    card: {
      backgroundColor: c.bg2,
      borderRadius: 24,
      padding: 20,
      marginBottom: 8, // Added for elevation spacing
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 }, // Slightly reduced shadow height
      shadowOpacity: 0.08, // Subtle shadow
      shadowRadius: 12,
      elevation: 4,
      // Removed border to match HostCard style, or keep it very subtle if needed.
      // HostCard has no border. I'll remove it.
    },
    cardHeader: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 20,
    },
    cardImage: {
      width: 90,
      height: 90,
      borderRadius: 16,
      backgroundColor: c.bg, // Placeholder color
    },
    cardInfo: {
      flex: 1,
      justifyContent: 'center',
      gap: 6,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    hostName: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      flex: 1,
      marginRight: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    location: {
      fontSize: 14,
      color: c.textMuted,
      fontWeight: '500',
      flex: 1,
    },
    dates: {
      fontSize: 14,
      color: c.textMuted,
      fontWeight: '500',
    },
    price: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginTop: 4,
    },
    priceLabel: {
      fontSize: 12,
      fontWeight: '400',
      color: c.textMuted,
    },
    statusBadge: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    badge_upcoming: {
      backgroundColor: '#E6F4EA',
    },
    badge_completed: {
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
    },
    badge_cancelled: {
      backgroundColor: '#FCE8E6',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
    },
    text_upcoming: {
      color: '#1E8E3E',
    },
    text_completed: {
      color: c.textMuted,
    },
    text_cancelled: {
      color: '#D93025',
    },
    cardFooter: {
      flexDirection: 'row',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 16,
    },
    messageButton: {
      flex: 1,
      backgroundColor: c.text,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
    },
    messageText: {
      color: c.bg,
      fontWeight: '600',
      fontSize: 14,
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    cancelText: {
      color: c.text,
      fontWeight: '600',
      fontSize: 14,
    },
    emptyContainer: {
      paddingTop: 80,
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: c.bg2,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    exploreButton: {
      backgroundColor: c.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 4,
    },
    exploreButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '700',
    },
  });
