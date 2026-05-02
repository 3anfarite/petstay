import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type LocationMapProps = {
    location: string;
};

type Coords = {
    latitude: number;
    longitude: number;
};

export function LocationMap({ location }: LocationMapProps) {
    const c = useColors();
    const [coords, setCoords] = useState<Coords | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    // Shimmer animation
    const shimmerOpacity = useSharedValue(0.3);
    useEffect(() => {
        shimmerOpacity.value = withRepeat(withTiming(0.7, { duration: 1000 }), -1, true);
    }, []);
    const shimmerStyle = useAnimatedStyle(() => ({ opacity: shimmerOpacity.value }));

    useEffect(() => {
        let cancelled = false;

        const geocode = async () => {
            if (!location || !location.trim()) {
                setError(true);
                setIsLoading(false);
                return;
            }

            try {
                const results = await Location.geocodeAsync(location);
                if (!cancelled && results.length > 0) {
                    setCoords({
                        latitude: results[0].latitude,
                        longitude: results[0].longitude,
                    });
                } else if (!cancelled) {
                    setError(true);
                }
            } catch (e) {
                console.warn('Geocoding failed for:', location, e);
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        geocode();
        return () => { cancelled = true; };
    }, [location]);

    const openInMaps = () => {
        if (!coords) return;
        const scheme = Platform.select({
            ios: `maps:0,0?q=${encodeURIComponent(location)}@${coords.latitude},${coords.longitude}`,
            android: `geo:${coords.latitude},${coords.longitude}?q=${encodeURIComponent(location)}`,
        });
        if (scheme) Linking.openURL(scheme);
    };

    if (isLoading) {
        return (
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>
                    {i18n.t('host_location_title', { defaultValue: 'Location' })}
                </Text>
                <Animated.View
                    style={[
                        styles.mapContainer,
                        { backgroundColor: c.border, borderColor: c.border },
                        shimmerStyle,
                    ]}
                />
            </View>
        );
    }

    if (error || !coords) {
        return null; // Silently hide if geocoding fails
    }

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>
                {i18n.t('host_location_title', { defaultValue: 'Location' })}
            </Text>
            <Text style={[styles.locationSubtitle, { color: c.textMuted }]}>
                {location}
            </Text>
            <View style={[styles.mapContainer, { borderColor: c.border }]}>
                <MapView
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={{
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    toolbarEnabled={false}
                    showsUserLocation={false}
                    liteMode={Platform.OS === 'android'}
                >
                    <Marker
                        coordinate={coords}
                        title={location}
                    >
                        <View style={[styles.markerContainer, { backgroundColor: c.primary }]}>
                            <Ionicons name="paw" size={18} color="white" />
                        </View>
                    </Marker>
                </MapView>
            </View>
            <TouchableOpacity style={[styles.directionsBtn, { backgroundColor: c.text }]} onPress={openInMaps}>
                <Ionicons name="navigate-outline" size={18} color={c.bg} />
                <Text style={[styles.directionsBtnText, { color: c.bg }]}>
                    {i18n.t('host_get_directions', { defaultValue: 'Get Directions' })}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    locationSubtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    mapContainer: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    markerContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    directionsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 14,
    },
    directionsBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
