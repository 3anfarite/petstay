import { Categories } from "@/components/categories";
import { FilterState } from "@/components/filter-modal";
import { EmptyHostList } from "@/components/home/empty-host-list";
import { HostList } from "@/components/home/host-list";
import { useLanguage } from '@/components/LanguageProvider';
import { SearchBar } from "@/components/search-bar";
import { dummyCategories } from "@/constants/dummyData";
import { useColors } from '@/hooks/use-theme-color';
import { useRouter } from "expo-router";
import { useCallback, useState, useEffect } from 'react';
import { Platform, StatusBar, View, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ListingService, Listing } from '@/lib/listingService';
import { useAuthStore } from '@/store/useAuthStore';
import { WishlistService } from '@/lib/wishlistService';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

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
             <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
          ) : filteredHosts.length === 0 ? (
            <EmptyHostList
              selectedCategory={selectedCategory}
              selectedService={filters?.selectedService}
            />
          ) : (
            <HostList
              hosts={filteredHosts}
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