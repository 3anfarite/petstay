import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type LocationCoords = {
    latitude: number;
    longitude: number;
};

type LocationPickerModalProps = {
    visible: boolean;
    onClose: () => void;
    onConfirm: (locationString: string, coords: LocationCoords) => void;
    initialCoords?: LocationCoords;
};

export function LocationPickerModal({ visible, onClose, onConfirm, initialCoords }: LocationPickerModalProps) {
    const c = useColors();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const [region, setRegion] = useState<Region>({
        latitude: initialCoords?.latitude || 37.78825,
        longitude: initialCoords?.longitude || -122.4324,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });
    const [address, setAddress] = useState<string>('');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (visible && !initialCoords) {
            getCurrentLocation();
        } else if (visible && initialCoords) {
            setRegion({
                latitude: initialCoords.latitude,
                longitude: initialCoords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
            reverseGeocode(initialCoords.latitude, initialCoords.longitude);
        }
    }, [visible, initialCoords]);

    const getCurrentLocation = async () => {
        setIsLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
            await reverseGeocode(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            console.warn("Could not get current location", error);
        } finally {
            setIsLocating(false);
        }
    };

    const reverseGeocode = async (latitude: number, longitude: number) => {
        setIsLoadingAddress(true);
        try {
            const result = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (result.length > 0) {
                const place = result[0];
                const parts = [];
                if (place.city || place.subregion) parts.push(place.city || place.subregion);
                if (place.region) parts.push(place.region);
                if (parts.length === 0 && place.country) parts.push(place.country);
                
                setAddress(parts.join(', ') || 'Unknown Location');
            } else {
                setAddress('Unknown Location');
            }
        } catch (error) {
            console.warn("Reverse geocode failed", error);
            setAddress('Location Not Found');
        } finally {
            setIsLoadingAddress(false);
        }
    };

    const handleRegionChangeComplete = (newRegion: Region) => {
        setRegion(newRegion);
        reverseGeocode(newRegion.latitude, newRegion.longitude);
    };

    const handleConfirm = () => {
        onConfirm(address, { latitude: region.latitude, longitude: region.longitude });
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: c.bg }]}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: c.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={c.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: c.text }]}>Select Location</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Map Area */}
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={region}
                        onRegionChangeComplete={handleRegionChangeComplete}
                        showsUserLocation={true}
                    />
                    
                    {/* Fixed Center Pin */}
                    <View style={styles.centerPinContainer} pointerEvents="none">
                        <View style={[styles.markerContainer, { backgroundColor: c.primary }]}>
                            <Ionicons name="location" size={24} color="white" />
                        </View>
                        <View style={[styles.pinStem, { backgroundColor: c.primary }]} />
                        <View style={[styles.pinShadow, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
                    </View>

                    {/* Current Location Button */}
                    <TouchableOpacity 
                        style={[styles.locateBtn, { backgroundColor: c.bg }]} 
                        onPress={getCurrentLocation}
                    >
                        {isLocating ? (
                            <ActivityIndicator size="small" color={c.primary} />
                        ) : (
                            <Ionicons name="locate" size={24} color={c.text} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Bottom Panel */}
                <View style={[styles.bottomPanel, { backgroundColor: c.bg2, paddingBottom: insets.bottom + 20 }]}>
                    <Text style={[styles.addressLabel, { color: c.textMuted }]}>Selected Location</Text>
                    
                    <View style={styles.addressRow}>
                        {isLoadingAddress ? (
                            <ActivityIndicator size="small" color={c.primary} style={{ marginRight: 8 }} />
                        ) : (
                            <Ionicons name="location" size={20} color={c.primary} style={{ marginRight: 8 }} />
                        )}
                        <Text style={[styles.addressText, { color: c.text }]} numberOfLines={1}>
                            {isLoadingAddress ? "Updating..." : (address || "Move map to select")}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={[styles.confirmBtn, { backgroundColor: c.primary }]} 
                        onPress={handleConfirm}
                        disabled={isLoadingAddress || !address}
                    >
                        <Text style={styles.confirmBtnText}>Confirm Location</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
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
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontFamily: AppFonts.bodyBold,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    centerPinContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -30, // Offset to make the tip of the pin point to the center
    },
    markerContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 2,
    },
    pinStem: {
        width: 4,
        height: 12,
        marginTop: -4,
        zIndex: 1,
    },
    pinShadow: {
        width: 12,
        height: 4,
        borderRadius: 6,
        marginTop: -2,
        transform: [{ scaleX: 2 }],
    },
    locateBtn: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    bottomPanel: {
        paddingHorizontal: 24,
        paddingTop: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    addressLabel: {
        fontSize: 14,
        fontFamily: AppFonts.body,
        marginBottom: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        height: 30,
    },
    addressText: {
        fontSize: 18,
        fontFamily: AppFonts.bodyBold,
        flex: 1,
    },
    confirmBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        color: 'white',
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    },
});
