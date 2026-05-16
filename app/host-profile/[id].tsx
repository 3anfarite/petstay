import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { db } from '@/lib/firebaseConfig';
import { Listing, ListingService } from '@/lib/listingService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HostCard from '@/components/host-card';
import { AppFonts } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function PublicHostProfile() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const c = useColors();
    const insets = useSafeAreaInsets();

    const [hostData, setHostData] = useState<any>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (typeof id !== 'string') return;
            try {
                // Fetch User/Host data
                const userDoc = await getDoc(doc(db, "users", id));
                if (userDoc.exists()) {
                    setHostData(userDoc.data());
                }

                // Fetch their listings
                const hostListings = await ListingService.getHostListings(id);
                setListings(hostListings.filter(l => l.status === 'active'));
            } catch (error) {
                console.error("Error fetching public host profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: c.bg2 }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    if (!hostData) {
        return (
            <View style={[styles.centered, { backgroundColor: c.bg2 }]}>
                <Text style={{ color: c.text }}>Host not found</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: c.bg2 }]}>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header / Cover */}
                <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: c.primary + '10' }]}>
                    <TouchableOpacity 
                        style={[styles.backButton, { backgroundColor: c.bg }]} 
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={c.text} />
                    </TouchableOpacity>

                    <View style={styles.profileInfo}>
                        <Image
                            source={{ uri: hostData.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(hostData.name || 'User')}&background=F3F4F6&color=374151&size=256` }}
                            style={styles.avatar}
                        />
                        <Text style={[styles.name, { color: c.text }]}>{hostData.name}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={16} color={c.primary} />
                            <Text style={[styles.locationText, { color: c.textMuted }]}>{hostData.location || 'PetStay Host'}</Text>
                        </View>

                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: c.primary + '20' }]}>
                                <Ionicons name="shield-checkmark" size={14} color={c.primary} />
                                <Text style={[styles.badgeText, { color: c.primary }]}>Verified</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: '#FFD70020' }]}>
                                <Ionicons name="star" size={14} color="#D4AF37" />
                                <Text style={[styles.badgeText, { color: '#D4AF37' }]}>4.9 Rating</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Bio Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>{i18n.t('host_about')}</Text>
                        <Text style={[styles.bioText, { color: c.textMuted }]}>
                            {hostData.bio || "This host hasn't provided a bio yet."}
                        </Text>
                    </View>

                    {/* Services Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>{i18n.t('host_profile_services')}</Text>
                        <View style={styles.servicesGrid}>
                            {hostData.services?.map((service: string) => (
                                <View key={service} style={[styles.serviceChip, { backgroundColor: c.bg, borderColor: c.border }]}>
                                    <Ionicons name="checkmark-circle" size={16} color={c.primary} />
                                    <Text style={[styles.serviceText, { color: c.text }]}>{i18n.t(`service_${service}`)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Listings Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>Listings by {hostData.name?.split(' ')[0]}</Text>
                        {listings.length === 0 ? (
                            <Text style={{ color: c.textMuted, fontStyle: 'italic' }}>No active listings at the moment.</Text>
                        ) : (
                            listings.map(item => (
                                <HostCard
                                    key={item.id}
                                    name={item.title}
                                    location={item.location}
                                    price={`${item.price}`}
                                    services={item.services}
                                    image={item.image}
                                    onPress={() => router.push(`/host/${item.id}`)}
                                />
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingBottom: 32,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'white',
        marginBottom: 16,
    },
    name: {
        fontSize: 28,
        fontFamily: AppFonts.title,
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 16,
    },
    locationText: {
        fontSize: 16,
        fontFamily: AppFonts.body,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 13,
        fontFamily: AppFonts.bodyBold,
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: AppFonts.title,
        marginBottom: 16,
    },
    bioText: {
        fontSize: 16,
        lineHeight: 24,
        fontFamily: AppFonts.body,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    serviceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    serviceText: {
        fontSize: 14,
        fontFamily: AppFonts.bodyBold,
    },
});
