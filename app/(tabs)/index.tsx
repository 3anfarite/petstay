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

export default function Home() {
  const router = useRouter();
  const { locale } = useLanguage(); // Force re-render on language change
  const [selectedCategory, setSelectedCategory] = useState(dummyCategories[0].name);
  const [filters, setFilters] = useState<FilterState | null>(null);

  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveListings = async () => {
    try {
      const data = await ListingService.getAllActiveListings();
      setActiveListings(data);
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
          <SearchBar onApply={setFilters} />
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
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          )}
        </View>
      </>
    </SafeAreaView>
  );
}