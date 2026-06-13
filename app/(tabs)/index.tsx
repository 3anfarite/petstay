import { Categories } from "@/components/categories";
import { FilterState } from "@/components/filter-modal";
import { EmptyHostList } from "@/components/home/empty-host-list";
import { HostList } from "@/components/home/host-list";
import { useLanguage } from '@/components/LanguageProvider';
import { SearchBar } from "@/components/search-bar";
import { dummyCategories } from "@/constants/dummyData";
import { useColors } from '@/hooks/use-theme-color';
import { useRouter } from "expo-router";
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Platform, StatusBar, View, ActivityIndicator, Animated, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ListingService, Listing } from '@/lib/listingService';
import { useAuthStore } from '@/store/useAuthStore';
import { WishlistService } from '@/lib/wishlistService';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

const SkeletonPulse = ({ width, height, borderRadius, style }: any) => {
    const c = useColors();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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

const HostCardSkeleton = () => {
    const c = useColors();
    return (
        <View style={{ backgroundColor: c.bg2, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
            {/* Image Placeholder */}
            <View style={{ position: 'relative' }}>
                <SkeletonPulse width="100%" height={280} borderRadius={16} />
                {/* tags inside image */}
                <View style={{ position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', gap: 6 }}>
                    <SkeletonPulse width={60} height={20} borderRadius={8} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    <SkeletonPulse width={60} height={20} borderRadius={8} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                </View>
            </View>

            {/* Info Placeholder */}
            <View style={{ padding: 16, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SkeletonPulse width="60%" height={20} borderRadius={6} />
                    <SkeletonPulse width="15%" height={20} borderRadius={6} />
                </View>
                <SkeletonPulse width="40%" height={16} borderRadius={6} />
                <SkeletonPulse width="30%" height={16} borderRadius={6} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <SkeletonPulse width="25%" height={22} borderRadius={6} />
                </View>
            </View>
        </View>
    );
};

export default function Home() {
  const router = useRouter();
  const { locale } = useLanguage(); // Force re-render on language change
  const [selectedCategory, setSelectedCategory] = useState(dummyCategories[0].name);
  const [filters, setFilters] = useState<FilterState | null>(null);

  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const { user } = useAuthStore();

  const fetchActiveListings = async () => {
    try {
      const data = await ListingService.getAllActiveListings();
      
      // Enrich listings with real host ratings from user documents
      const uniqueHostIds = [...new Set(data.map(l => l.hostId))];
      const hostRatings: Record<string, { rating: number; reviewCount: number }> = {};
      
      await Promise.all(
        uniqueHostIds.map(async (hostId) => {
          try {
            const hostDoc = await getDoc(doc(db, 'users', hostId));
            if (hostDoc.exists()) {
              const hd = hostDoc.data();
              hostRatings[hostId] = {
                rating: hd.averageRating || 0,
                reviewCount: hd.reviewCount || 0,
              };
            }
          } catch {} // Silently skip hosts that can't be fetched
        })
      );
      
      const enriched = data.map(l => ({
        ...l,
        rating: hostRatings[l.hostId]?.rating || undefined,
        reviewCount: hostRatings[l.hostId]?.reviewCount || 0,
      }));
      
      setActiveListings(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveListings();
  }, []);

  useEffect(() => {
    if (!user) {
      setWishlistIds([]);
      return;
    }

    // Subscribe to user wishlist changes
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        setWishlistIds(doc.data().wishlist || []);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const toggleWishlist = async (listingId: string) => {
    if (!user) {
      router.push('/auth/welcome');
      return;
    }
    await WishlistService.toggleWishlist(user.uid, listingId);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActiveListings();
  }, []);

  const c = useColors();
  const insets = useSafeAreaInsets();

  const filteredHosts = activeListings.filter((host) => {
    let matchesCategory = true;
    if (filters?.selectedService && filters.selectedService !== 'All') {
      matchesCategory = host.services?.includes(filters.selectedService);
    } else if (selectedCategory !== 'All') {
      matchesCategory = host.services?.includes(selectedCategory);
    }

    if (!filters) return matchesCategory;

    const matchesLocation = filters.location ? host.location.toLowerCase().includes(filters.location.toLowerCase()) : true;
    const matchesMinPrice = filters.minPrice ? host.price >= parseInt(filters.minPrice) : true;
    const matchesMaxPrice = filters.maxPrice ? host.price <= parseInt(filters.maxPrice) : true;
    const matchesVerified = filters.isVerified ? host.verified : true;

    return matchesCategory && matchesLocation && matchesMinPrice && matchesMaxPrice && matchesVerified;
  });

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{
        flex: 1,
        backgroundColor: c.bg2,
        paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight : -24
      }} >
      <>
        <View>
          <SearchBar onApply={setFilters} listings={activeListings} />
          {/* @ts-ignore Categories is a valid functional component despite what TypeScript infers here */}
          <Categories
            selectedCategory={filters?.selectedService || selectedCategory}
            onCategorySelect={(cat) => {
              setSelectedCategory(cat);
              if (cat === 'All') {
                setFilters(null);
              } else if (filters?.selectedService) {
                setFilters({ ...filters, selectedService: null });
              }
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              <HostCardSkeleton />
              <HostCardSkeleton />
            </ScrollView>
          ) : filteredHosts.length === 0 ? (
            <EmptyHostList
              selectedCategory={selectedCategory}
              selectedService={filters?.selectedService}
            />
          ) : (
            <HostList
              hosts={filteredHosts as any}
              onHostPress={(id) => router.push(`/host/${id}`)}
              wishlistIds={wishlistIds}
              onToggleWishlist={toggleWishlist}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          )}
        </View>
      </>
    </SafeAreaView>
  );
}