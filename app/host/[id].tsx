import { BookingModal } from '@/components/booking/booking-modal';
import { GalleryList } from '@/components/host/gallery-list';
import { LocationMap } from '@/components/host/location-map';
import { ServiceList } from '@/components/host/service-list';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { BookingService } from '@/lib/bookingService';
import { ChatService } from '@/lib/chatService';
import { db } from '@/lib/firebaseConfig';
import { Listing, ListingService } from '@/lib/listingService';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

export default function HostDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const c = useColors();
    const insets = useSafeAreaInsets();
    const scrollY = useSharedValue(0);

    const [host, setHost] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedService, setSelectedService] = useState('Boarding');
    const [isBookingModalVisible, setBookingModalVisible] = useState(false);
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
    const [hostActiveBookings, setHostActiveBookings] = useState<any[]>([]);
    const [hostVacationDates, setHostVacationDates] = useState<Date[]>([]);
    const [hostMaxCapacity, setHostMaxCapacity] = useState(1);
    const [hostProfilePic, setHostProfilePic] = useState<string | null>(null);
    const [unavailableTimes, setUnavailableTimes] = useState<Record<string, string[]>>({});

    const { user } = useAuthStore();

    useEffect(() => {
        const loadListing = async () => {
            if (typeof id !== 'string') return;
            const data = await ListingService.getListingById(id);
            setHost(data);
            setSelectedService(data?.services?.[0] || 'Boarding');
            setIsLoading(false);

            if (data?.hostId) {
                try {
                    // Fetch host document for capacity and vacationDates
                    const hostDocSnap = await getDoc(doc(db, "users", data.hostId));
                    if (hostDocSnap.exists()) {
                        const hd = hostDocSnap.data();
                        setHostMaxCapacity(hd.maxPetCapacity || 1);
                        setHostProfilePic(hd.profilePic || null);
                        if (hd.vacationDates && Array.isArray(hd.vacationDates)) {
                            setHostVacationDates(hd.vacationDates.map((d: string) => new Date(d)));
                        }
                    }

                    // Fetch active bookings
                    const bookings = await BookingService.getHostBookings(data.hostId);
                    const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
                    setHostActiveBookings(activeBookings);
                } catch (error) {
                    console.error('Failed to fetch host details', error);
                }
            }
        };
        loadListing();
    }, [id]);

    useEffect(() => {
        const dailyPets: Record<string, number> = {};
        const guestDates: Record<string, boolean> = {};
        const hourlyPets: Record<string, Record<string, number>> = {};
        const timesToDisable: Record<string, string[]> = {};
        
        const isHourly = ['grooming', 'walking', 'training', 'vets'].includes((selectedService || '').toLowerCase());

        hostActiveBookings.forEach(b => {
            const start = new Date(b.startDate);
            const end = new Date(b.endDate);
            const petsMatch = b.petType.match(/\d+/);
            const pets = petsMatch ? parseInt(petsMatch[0]) : 1;
            
            const bIsHourly = ['grooming', 'walking', 'training', 'vets'].includes((b.serviceType || '').toLowerCase());

            if (bIsHourly) {
                // If a booking is hourly, we check if it conflicts with the current hour selection
                const dateStr = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}`;
                const hours = start.getHours();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const h12 = hours % 12 || 12;
                const timeStr = `${h12.toString().padStart(2, '0')}:00 ${ampm}`;

                if (!hourlyPets[dateStr]) hourlyPets[dateStr] = {};
                hourlyPets[dateStr][timeStr] = (hourlyPets[dateStr][timeStr] || 0) + pets;

                if (!timesToDisable[dateStr]) timesToDisable[dateStr] = [];
                
                // Block if this guest already has a booking at this exact hour (regardless of service)
                if (b.guestId === user?.uid && !timesToDisable[dateStr].includes(timeStr)) {
                    timesToDisable[dateStr].push(timeStr);
                }
            } else {
                let current = new Date(start);
                current.setHours(0,0,0,0);
                const endDateNormalized = new Date(end);
                endDateNormalized.setHours(0,0,0,0);

                while(current <= endDateNormalized) {
                    const dateStr = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`;
                    dailyPets[dateStr] = (dailyPets[dateStr] || 0) + pets;
                    
                    if (!isHourly && b.guestId === user?.uid && b.serviceType.toLowerCase() === selectedService.toLowerCase()) {
                        guestDates[dateStr] = true;
                    }
                    
                    current.setDate(current.getDate() + 1);
                }
            }
        });

        // Add hours that reach host capacity to timesToDisable
        Object.entries(hourlyPets).forEach(([dateStr, times]) => {
            Object.entries(times).forEach(([timeStr, pets]) => {
                if (pets >= hostMaxCapacity) {
                    if (!timesToDisable[dateStr]) timesToDisable[dateStr] = [];
                    if (!timesToDisable[dateStr].includes(timeStr)) {
                        timesToDisable[dateStr].push(timeStr);
                    }
                }
            });
        });

        const fullyBookedDates = Object.entries(dailyPets)
            .filter(([_, count]) => count >= hostMaxCapacity)
            .map(([dateStr]) => new Date(dateStr));

        const userBookedDates = Object.keys(guestDates).map(dateStr => new Date(dateStr));

        setUnavailableDates([...hostVacationDates, ...fullyBookedDates, ...userBookedDates]);
        setUnavailableTimes(timesToDisable);
    }, [hostActiveBookings, selectedService, hostVacationDates, hostMaxCapacity, user?.uid]);

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const headerStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(
                scrollY.value,
                [-IMG_HEIGHT, 0, IMG_HEIGHT],
                [IMG_HEIGHT * 2, IMG_HEIGHT, IMG_HEIGHT * 0.5],
                Extrapolation.CLAMP
            ),
            transform: [
                {
                    scale: interpolate(
                        scrollY.value,
                        [-IMG_HEIGHT, 0, IMG_HEIGHT],
                        [2, 1, 1],
                        Extrapolation.CLAMP
                    ),
                },
            ],
        };
    });

    const headerBlurStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                scrollY.value,
                [0, IMG_HEIGHT / 2],
                [0, 1],
                Extrapolation.CLAMP
            ),
        };
    });

    if (isLoading) {
        return <HostDetailSkeleton />;
    }

    if (!host) {
        return (
            <View style={{ flex: 1, backgroundColor: c.bg2 }}>
                <Stack.Screen options={{ headerShown: false }} />
            </View>
        );
    }

    const hasImage = !!host.image && host.image.trim() !== '';

    return (
        <View style={[styles.container, { backgroundColor: c.bg2 }]}>
            <StatusBar barStyle={hasImage ? "light-content" : (c.text === '#000000' ? "dark-content" : "light-content")} />

            {/* Animated Header Image */}
            {hasImage && (
                <Animated.View style={[styles.imageContainer, headerStyle]}>
                    <Image source={{ uri: host.image }} style={styles.image} />
                    <Animated.View style={[StyleSheet.absoluteFill, headerBlurStyle]}>
                        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    </Animated.View>
                </Animated.View>
            )}

            {/* Navigation Header */}
            <View style={[styles.navHeader, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.iconButton, !hasImage && { backgroundColor: 'transparent' }]}
                >
                    <Ionicons name="arrow-back" size={24} color={hasImage ? "white" : c.text} />
                </TouchableOpacity>
                <View style={styles.rightIcons}>
                    <TouchableOpacity style={[styles.iconButton, !hasImage && { backgroundColor: 'transparent' }]}>
                        <Ionicons name="share-outline" size={24} color={hasImage ? "white" : c.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconButton, !hasImage && { backgroundColor: 'transparent' }]}>
                        <Ionicons name="heart-outline" size={24} color={hasImage ? "white" : c.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: hasImage ? IMG_HEIGHT - 32 : insets.top + 60, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.content, { backgroundColor: c.bg2, borderTopLeftRadius: hasImage ? 32 : 0, borderTopRightRadius: hasImage ? 32 : 0 }]}>
                    {/* Handle Bar */}
                    {hasImage && (
                        <View style={styles.handleBarContainer}>
                            <View style={[styles.handleBar, { backgroundColor: c.border }]} />
                        </View>
                    )}

                    {/* Title Section */}
                    <View style={styles.section}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.name, { color: c.text }]}>{host.title}</Text>
                        </View>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={16} color={c.textMuted} />
                            <Text style={[styles.location, { color: c.textMuted }]}>
                                {host.location}
                            </Text>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Ionicons name="star" size={20} color="#FFD700" />
                                <Text style={[styles.statValue, { color: c.text }]}>
                                    {4.9}
                                </Text>
                                <Text style={[styles.statLabel, { color: c.textMuted }]}>
                                    {i18n.t('host_reviews', { count: 12 })}
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: c.border }]} />
                            <View style={styles.stat}>
                                <Ionicons name="shield-checkmark" size={20} color={c.primary} />
                                <Text style={[styles.statValue, { color: c.text }]}>
                                    {i18n.t('host_identity')}
                                </Text>
                                <Text style={[styles.statLabel, { color: c.textMuted }]}>
                                    {i18n.t('host_verified')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.separator, { backgroundColor: c.border }]} />

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>{i18n.t('host_about')}</Text>
                        <Text style={[styles.description, { color: c.textMuted }]}>
                            {host.about}
                        </Text>
                    </View>

                    <View style={[styles.separator, { backgroundColor: c.border }]} />

                    {/* Host Profile Section */}
                    <View style={styles.section}>
                        <View style={styles.hostSectionHeader}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: c.text, marginBottom: 4 }]}>Meet the Host</Text>
                                <Text style={[styles.hostName, { color: c.text }]}>{host.hostName}</Text>
                            </View>
                            <Image 
                                source={{ uri: hostProfilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(host.hostName || 'Host')}&background=F3F4F6&color=374151&size=256` }} 
                                style={styles.hostAvatar} 
                            />
                        </View>
                        <TouchableOpacity 
                            style={[styles.viewProfileBtn, { borderColor: c.primary }]}
                            onPress={() => router.push(`/host-profile/${host.hostId}`)}
                        >
                            <Text style={[styles.viewProfileText, { color: c.primary }]}>View Host Profile</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.separator, { backgroundColor: c.border }]} />

                    {/* Services Section */}
                    <ServiceList
                        services={host.services}
                        price={host.price}
                        selectedService={selectedService}
                        onSelectService={setSelectedService}
                    />

                    <View style={[styles.separator, { backgroundColor: c.border }]} />

                    {/* Gallery Preview */}
                    {(() => {
                        const galleryItems = [...(host.gallery || [])];
                        if (host.image && !galleryItems.includes(host.image)) {
                            galleryItems.unshift(host.image);
                        }
                        const validGallery = galleryItems.filter(img => img && img.trim() !== '');
                        
                        if (validGallery.length === 0) return null;
                        return <GalleryList images={validGallery} />;
                    })()}

                    <View style={[styles.separator, { backgroundColor: c.border }]} />

                    {/* Location Map */}
                    <LocationMap location={host.location} locationCoords={host.locationCoords} />
                </View>
            </Animated.ScrollView>

            {/* Bottom Action Bar */}
            <View
                style={[
                    styles.footer,
                    { backgroundColor: c.bg2, borderTopColor: c.border, paddingBottom: insets.bottom + 16 },
                ]}
            >
                <View>
                    <Text style={[styles.footerPrice, { color: c.text }]}>
                        ${host.price}
                        <Text style={[styles.footerUnit, { color: c.textMuted }]}>
                            {' '}
                            {i18n.t('host_per_night')}
                        </Text>
                    </Text>
                    <Text style={[styles.footerDate, { color: c.textMuted }]}>
                        Oct 20 - 25
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.bookButton, { backgroundColor: c.primary }]}
                    activeOpacity={0.8}
                    onPress={() => setBookingModalVisible(true)}
                >
                    <Text style={styles.bookButtonText}>{i18n.t('host_book_now')}</Text>
                </TouchableOpacity>
            </View>

            <BookingModal
                visible={isBookingModalVisible}
                onClose={() => setBookingModalVisible(false)}
                isSubmitting={isSubmittingBooking}
                serviceType={selectedService}
                onConfirm={async (data) => {
                    if (!user) {
                        router.replace('/auth/welcome');
                        return;
                    }

                    try {
                        setIsSubmittingBooking(true);

                        // Grab Guest's denormalized data
                        const guestDoc = await getDoc(doc(db, 'users', user.uid));
                        const guestName = guestDoc.exists() ? (guestDoc.data()?.name || 'Guest') : 'Guest';
                        const guestAvatar = guestDoc.exists() ? (guestDoc.data()?.profilePic || '') : '';

                        await BookingService.createBooking({
                            guestId: user.uid,
                            guestName: guestName,
                            guestAvatar: guestAvatar,
                            hostId: host.hostId, // Store actual user uid as hostId for booking
                            hostName: host.hostName,
                            location: host.location,
                            serviceType: selectedService,
                            petType: `x${data.petCount} Pets`,
                            startDate: data.startDate.toISOString(),
                            endDate: data.endDate.toISOString(),
                            totalPrice: data.totalPrice,
                        });

                        // Send an automated greeting message from the Host to the Guest
                        await ChatService.startChatAndSendMessage(
                            host.hostId,
                            user.uid,
                            host.hostName,
                            guestName,
                            host.hostAvatar || '',
                            guestAvatar,
                            `Hi ${guestName}! Thank you for your booking request for ${data.petCount} pet(s). I will review it and get back to you shortly!`
                        );

                        setBookingModalVisible(false);
                        setIsSubmittingBooking(false);
                        router.push('/(tabs)/bookings');
                    } catch (error: any) {
                        console.error('Submission failed:', error);
                        setIsSubmittingBooking(false);
                        Alert.alert("Booking Failed", error.message || "An unexpected error occurred.");
                    }
                }}
                pricePerNight={host.price}
                hostName={host.name}
                unavailableDates={unavailableDates}
                unavailableTimes={unavailableTimes}
            />
        </View>
    );
}

function HostDetailSkeleton() {
    const c = useColors();
    const insets = useSafeAreaInsets();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.7, { duration: 1000 }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const SkeletonItem = ({ style }: { style: any }) => (
        <Animated.View style={[{ backgroundColor: c.border, borderRadius: 8 }, style, animatedStyle]} />
    );

    return (
        <View style={{ flex: 1, backgroundColor: c.bg2 }}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header Image Skeleton */}
            <View style={{ height: IMG_HEIGHT, backgroundColor: c.border }} />
            
            <View style={{ flex: 1, marginTop: -32, backgroundColor: c.bg2, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
                {/* Title */}
                <SkeletonItem style={{ width: '60%', height: 32, marginBottom: 12 }} />
                {/* Location */}
                <SkeletonItem style={{ width: '40%', height: 20, marginBottom: 24 }} />
                
                {/* Stats */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                    <SkeletonItem style={{ flex: 1, height: 80, borderRadius: 16 }} />
                    <SkeletonItem style={{ flex: 1, height: 80, borderRadius: 16 }} />
                </View>
                
                {/* About */}
                <SkeletonItem style={{ width: '30%', height: 24, marginBottom: 16 }} />
                <SkeletonItem style={{ width: '100%', height: 16, marginBottom: 8 }} />
                <SkeletonItem style={{ width: '100%', height: 16, marginBottom: 8 }} />
                <SkeletonItem style={{ width: '80%', height: 16, marginBottom: 24 }} />
                
                {/* Services */}
                <SkeletonItem style={{ width: '40%', height: 24, marginBottom: 16 }} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <SkeletonItem style={{ width: 100, height: 120, borderRadius: 16 }} />
                    <SkeletonItem style={{ width: 100, height: 120, borderRadius: 16 }} />
                    <SkeletonItem style={{ width: 100, height: 120, borderRadius: 16 }} />
                </View>
            </View>
            
            {/* Footer */}
            <View style={{ 
                height: 100, 
                backgroundColor: c.bg2, 
                borderTopWidth: 1, 
                borderTopColor: c.border, 
                padding: 24, 
                paddingBottom: insets.bottom + 16,
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0
            }}>
                <View>
                    <SkeletonItem style={{ width: 80, height: 24, marginBottom: 4 }} />
                    <SkeletonItem style={{ width: 60, height: 16 }} />
                </View>
                <SkeletonItem style={{ width: 120, height: 48, borderRadius: 24 }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 0,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    navHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10,
        height: 100, // Approximate header height
    },
    rightIcons: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        minHeight: 500,
        paddingBottom: 40,
    },
    handleBarContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    section: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 16,
    },
    location: {
        fontSize: 15,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        padding: 16,
        borderRadius: 16,
        justifyContent: 'space-around',
    },
    stat: {
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
    },
    divider: {
        width: 1,
        height: '80%',
    },
    separator: {
        height: 1,
        marginHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    footerPrice: {
        fontSize: 20,
        fontWeight: '700',
    },
    footerUnit: {
        fontSize: 14,
        fontWeight: '400',
    },
    footerDate: {
        fontSize: 13,
        marginTop: 2,
    },
    bookButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    bookButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    hostSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    hostName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    hostAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    viewProfileBtn: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    viewProfileText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
});
