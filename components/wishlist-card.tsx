import { useColors } from '@/hooks/use-theme-color';
import { AppFonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useEffect } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import i18n from '@/i18n';

type WishlistCardProps = {
    name: string;
    location: string;
    price: string;
    services: string[];
    image: string;
    rating?: number;
    verified?: boolean;
    onPress?: () => void;
    onRemove?: () => void;
};

export function WishlistCard({
    name,
    location,
    price,
    services,
    image,
    rating,
    verified,
    onPress,
    onRemove,
}: WishlistCardProps) {
    const c = useColors();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: c.bg2 }]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            {/* Thumbnail */}
            <View style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.image} />
            </View>

            {/* Info */}
            <View style={styles.info}>
                <View style={styles.topRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{name}</Text>
                        {verified && <Ionicons name="checkmark-circle" size={13} color={c.primary} />}
                    </View>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={[styles.ratingText, { color: c.text }]}>
                            {rating != null ? rating.toFixed(1) : 'New'}
                        </Text>
                    </View>
                </View>

                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color={c.textMuted} />
                    <Text style={[styles.location, { color: c.textMuted }]} numberOfLines={1}>{location}</Text>
                </View>

                <View style={styles.servicesRow}>
                    {services.slice(0, 2).map((s, i) => (
                        <View key={i} style={[styles.serviceChip, { backgroundColor: c.bg }]}>
                            <Text style={[styles.serviceChipText, { color: c.textMuted }]}>{s}</Text>
                        </View>
                    ))}
                    {services.length > 2 && (
                        <View style={[styles.serviceChip, { backgroundColor: c.bg }]}>
                            <Text style={[styles.serviceChipText, { color: c.textMuted }]}>+{services.length - 2}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomRow}>
                    <Text style={[styles.price, { color: c.text }]}>{price} MAD<Text style={[styles.priceUnit, { color: c.textMuted }]}> / {i18n.t('booking_night', { defaultValue: 'night' })}</Text></Text>

                    <TouchableOpacity
                        onPress={onRemove}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.heartButton}
                    >
                        <Ionicons name="heart" size={20} color="#FF385C" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SkeletonPulse = ({ width: w, height: h, borderRadius, style }: any) => {
    const c = useColors();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    return (
        <Animated.View
            style={[
                { width: w, height: h, borderRadius: borderRadius || 8, backgroundColor: c.border, opacity },
                style,
            ]}
        />
    );
};

export function WishlistCardSkeleton() {
    const c = useColors();
    return (
        <View style={[styles.card, { backgroundColor: c.bg2 }]}>
            <SkeletonPulse width={100} height={100} borderRadius={14} />
            <View style={[styles.info, { gap: 10 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <SkeletonPulse width="65%" height={18} borderRadius={6} />
                    <SkeletonPulse width="15%" height={18} borderRadius={6} />
                </View>
                <SkeletonPulse width="45%" height={14} borderRadius={6} />
                <View style={{ flexDirection: 'row', gap: 6 }}>
                    <SkeletonPulse width={60} height={22} borderRadius={10} />
                    <SkeletonPulse width={60} height={22} borderRadius={10} />
                </View>
                <SkeletonPulse width="35%" height={16} borderRadius={6} />
            </View>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        borderRadius: 18,
        padding: 12,
        marginBottom: 16,
        gap: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    imageWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 14,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 15,
        fontFamily: AppFonts.bodyBold,
        flex: 1,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 13,
        fontFamily: AppFonts.bodyBold,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    location: {
        fontSize: 13,
        fontFamily: AppFonts.body,
        flex: 1,
    },
    servicesRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 2,
    },
    serviceChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    serviceChipText: {
        fontSize: 11,
        fontFamily: AppFonts.bodyBold,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    price: {
        fontSize: 15,
        fontFamily: AppFonts.bodyBold,
    },
    priceUnit: {
        fontSize: 13,
        fontFamily: AppFonts.body,
    },
    heartButton: {
        padding: 4,
    },
});
