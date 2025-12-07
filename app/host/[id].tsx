import { GalleryList } from '@/components/host/gallery-list';
import { ServiceList } from '@/components/host/service-list';
import { dummyHosts } from '@/constants/dummyData';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
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

    // In a real app, fetch data by ID here
    const host = dummyHosts.find((h) => h.id === id) || dummyHosts[0];

    const [selectedService, setSelectedService] = useState(host.services[0]);

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

    return (
        <View style={[styles.container, { backgroundColor: c.bg2 }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />

            {/* Animated Header Image */}
            <Animated.View style={[styles.imageContainer, headerStyle]}>
                <Image source={{ uri: host.image }} style={styles.image} />
                <Animated.View style={[StyleSheet.absoluteFill, headerBlurStyle]}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                </Animated.View>
            </Animated.View>

            {/* Navigation Header */}
            <View style={[styles.navHeader, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.iconButton}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.rightIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="share-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="heart-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: IMG_HEIGHT - 32, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.content, { backgroundColor: c.bg2 }]}>
                    {/* Handle Bar */}
                    <View style={styles.handleBarContainer}>
                        <View style={[styles.handleBar, { backgroundColor: c.border }]} />
                    </View>

                    {/* Title Section */}
                    <View style={styles.section}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.name, { color: c.text }]}>{host.name}</Text>
                            {host.verified && (
                                <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                            )}
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
                                    {host.rating}
                                </Text>
                                <Text style={[styles.statLabel, { color: c.textMuted }]}>
                                    {i18n.t('host_reviews', { count: host.reviewCount })}
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

                    {/* Services Section */}
                    <ServiceList
                        services={host.services}
                        price={host.price}
                        selectedService={selectedService}
                        onSelectService={setSelectedService}
                    />

                    <View style={[styles.separator, { backgroundColor: c.border }]} />

                    {/* Gallery Preview */}
                    <GalleryList images={host.gallery || []} />
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
                >
                    <Text style={styles.bookButtonText}>{i18n.t('host_book_now')}</Text>
                </TouchableOpacity>
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
});
