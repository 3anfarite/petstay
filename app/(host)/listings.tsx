import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { ListingService, Listing } from '@/lib/listingService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function HostListings() {
    const c = useColors();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchListings = async () => {
        if (!user?.uid) return;
        setIsLoading(true);
        try {
            const data = await ListingService.getHostListings(user.uid);
            setListings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, [user]);

    const handleCreateListing = async () => {
        if (!user?.uid) return;
        
        try {
            // First fetch the latest profile data for defaults
            const docSnap = await getDoc(doc(db, "users", user.uid));
            const profile = docSnap.exists() ? docSnap.data() : {};
            
            // Generate a rapid generic listing to test with
            await ListingService.createListing({
                hostId: user.uid,
                hostName: profile.name || 'Host',
                hostAvatar: profile.profilePic || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
                title: "My Standard Pet Stay",
                location: profile.location || 'Remote',
                price: 35,
                services: profile.services?.length ? profile.services : ['Boarding'],
                image: 'https://images.unsplash.com/photo-1517423568366-eb51fb77d418?w=200&h=200&fit=crop',
                gallery: [
                    'https://images.unsplash.com/photo-1517423568366-eb51fb77d418?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop'
                ],
                about: profile.bio || "Hi, I am excited to take care of your pets! I provide a safe and warm environment.",
                verified: true, // Auto verified for testing
                status: 'active'
            });
            
            // Refresh list
            fetchListings();
        } catch (error) {
            console.error("Failed to create dummy listing", error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={c.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCreateListing} style={[styles.addButton, { backgroundColor: c.text }]}>
                        <Ionicons name="add" size={20} color={c.bg} />
                        <Text style={[styles.addText, { color: c.bg }]}>New Listing</Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_listings_title')}</Text>
            </View>
            
            {isLoading ? (
                <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={listings}
                    keyExtractor={item => item.id!}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={[styles.emptyText, { color: c.textMuted }]}>No active listings found. Create one to be searchable by guests!</Text>}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: item.image }} style={styles.image} />
                                <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? c.success + 'E6' : c.error + 'E6' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? '#4CAF50' : '#F44336' }]} />
                                    <Text style={[styles.statusText, { color: 'white' }]}>
                                        {item.status === 'active' ? i18n.t('host_card_status_active') : 'Inactive'}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
                                        <View style={styles.locationRow}>
                                            <Ionicons name="location-outline" size={14} color={c.textMuted} />
                                            <Text style={[styles.cardLocation, { color: c.textMuted }]}>{item.location}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.priceContainer}>
                                        <Text style={[styles.priceText, { color: c.text }]}>${item.price}</Text>
                                        <Text style={[styles.nightText, { color: c.textMuted }]}>/night</Text>
                                    </View>
                                </View>

                                <View style={[styles.divider, { backgroundColor: c.border }]} />

                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.primary + '15' }]}>
                                        <Ionicons name="pencil" size={18} color={c.primary} />
                                        <Text style={[styles.actionBtnText, { color: c.primary }]}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.border + '50' }]}>
                                        <Ionicons name="pause" size={18} color={c.text} />
                                        <Text style={[styles.actionBtnText, { color: c.text }]}>Pause</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
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
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 32,
        fontFamily: AppFonts.title,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 6,
    },
    addText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 24,
    },
    card: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    imageContainer: {
        width: '100%',
        height: 180,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E0E0E0',
    },
    statusBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontFamily: AppFonts.bodyBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontFamily: AppFonts.title,
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cardLocation: {
        fontSize: 14,
        fontFamily: AppFonts.body,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 22,
        fontFamily: AppFonts.title,
    },
    nightText: {
        fontSize: 12,
        fontFamily: AppFonts.body,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 16,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontFamily: AppFonts.bodyBold,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    }
});
