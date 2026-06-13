import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { WishlistService } from '@/lib/wishlistService';
import { Listing } from '@/lib/listingService';
import { WishlistCard, WishlistCardSkeleton } from '@/components/wishlist-card';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useEffect, useState } from 'react';
import { AppFonts } from '@/constants/theme';

export default function WishlistScreen() {
    const c = useColors();
    const router = useRouter();
    const { user } = useAuthStore();
    const [wishlistListings, setWishlistListings] = useState<Listing[]>([]);
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setWishlistListings([]);
            setIsLoading(false);
            return;
        }

        // Subscribe to wishlist changes
        const unsubscribe = onSnapshot(doc(db, "users", user.uid), async (doc) => {
            if (doc.exists()) {
                const listings = await WishlistService.getWishlistListings(user.uid);
                setWishlistListings(listings);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const toggleWishlist = async (listingId: string) => {
        if (!user) return;
        await WishlistService.toggleWishlist(user.uid, listingId);
    };

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets?.top ?? 0 }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: c.text }]}>{i18n.t('wishlist_title')}</Text>
                {!isLoading && wishlistListings.length > 0 && (
                    <Text style={[styles.count, { color: c.textMuted }]}>
                        {i18n.t(wishlistListings.length === 1 ? 'wishlist_saved_one' : 'wishlist_saved_other', { count: wishlistListings.length })}
                    </Text>
                )}
            </View>

            <View style={styles.content}>
                {isLoading ? (
                    <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                        <WishlistCardSkeleton />
                        <WishlistCardSkeleton />
                        <WishlistCardSkeleton />
                        <WishlistCardSkeleton />
                        <WishlistCardSkeleton />
                    </ScrollView>
                ) : wishlistListings.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <View style={styles.emptyState}>
                            <View style={[styles.iconContainer, { backgroundColor: c.bg }]}>
                                <Ionicons name="heart-outline" size={48} color={c.textMuted} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: c.text }]}>{i18n.t('wishlist_empty_title')}</Text>
                            <Text style={[styles.emptySubtitle, { color: c.textMuted }]}>
                                {i18n.t('wishlist_empty_subtitle')}
                            </Text>
                            <TouchableOpacity
                                style={[styles.exploreButton, { backgroundColor: c.primary }]}
                                onPress={() => router.push('/(tabs)')}
                            >
                                <Text style={styles.buttonText}>{i18n.t('wishlist_empty_btn')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <FlatList
                        data={wishlistListings}
                        keyExtractor={(item) => item.id!}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <WishlistCard
                                name={item.title}
                                location={item.location}
                                price={`${item.price}`}
                                services={item.services}
                                image={item.image}
                                rating={item.rating}
                                verified={item.verified}
                                onPress={() => router.push(`/host/${item.id}`)}
                                onRemove={() => toggleWishlist(item.id!)}
                            />
                        )}
                    />
                )}
            </View>
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
        paddingBottom: 16,
    },
    title: {
        fontSize: 32,
        fontFamily: AppFonts.title,
        letterSpacing: -0.5,
    },
    count: {
        fontSize: 14,
        fontFamily: AppFonts.body,
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyState: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: AppFonts.bodyBold,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        fontFamily: AppFonts.body,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    exploreButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 14,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    },
});
