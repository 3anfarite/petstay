import { Categories } from "@/components/categories";
import HostCard from "@/components/host-card";
import { SearchBar } from "@/components/search-bar";
import { dummyCategories, dummyHosts } from "@/constants/dummyData";
import { useColors } from '@/hooks/use-theme-color';
import { useState } from 'react';
import { FlatList, Platform, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";



import { FilterState } from "@/components/filter-modal";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(dummyCategories[0].name);
  const [filters, setFilters] = useState<FilterState | null>(null);

  const c = useColors();
  // const styles = makeStyles(c);


  const insets = useSafeAreaInsets();
  console.log(insets);
  console.log(Platform.OS);

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
    <SafeAreaView style={{
      backgroundColor: c.bg2,
      paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight : -24
    }} >
      <>
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
        <FlatList
          data={filteredHosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HostCard
              name={item.name}
              rating={item.rating}
              location={item.location}
              price={`${item.price}`}
              services={item.services}
              image={item.image}
              verified={item.verified}
              onPress={() => router.push(`/host/${item.id}`)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      </>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "gray" },
});