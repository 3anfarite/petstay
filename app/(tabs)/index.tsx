import { Categories } from "@/components/categories";
import { FilterState } from "@/components/filter-modal";
import { EmptyHostList } from "@/components/home/empty-host-list";
import { HostList } from "@/components/home/host-list";
import { SearchBar } from "@/components/search-bar";
import { dummyCategories, dummyHosts } from "@/constants/dummyData";
import { useColors } from '@/hooks/use-theme-color';
import { useRouter } from "expo-router";
import { useState } from 'react';
import { Platform, StatusBar, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(dummyCategories[0].name);
  const [filters, setFilters] = useState<FilterState | null>(null);

  const c = useColors();
  const insets = useSafeAreaInsets();

  const filteredHosts = dummyHosts.filter((host) => {
    // Category filter (always active unless overridden by search filters?)
    // Usually search filters are additive or replace category.
    // Let's make them additive for now, or if a service is selected in filters, it overrides category tab.

    let matchesCategory = true;
    if (filters?.selectedService) {
      matchesCategory = host.services.includes(filters.selectedService);
    } else if (selectedCategory !== 'All') {
      matchesCategory = host.services.includes(selectedCategory);
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
          {filteredHosts.length === 0 ? (
            <EmptyHostList
              selectedCategory={selectedCategory}
              selectedService={filters?.selectedService}
            />
          ) : (
            <HostList
              hosts={filteredHosts}
              onHostPress={(id) => router.push(`/host/${id}`)}
            />
          )}
        </View>
      </>
    </SafeAreaView>
  );
}