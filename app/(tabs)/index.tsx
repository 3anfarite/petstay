import { Categories } from "@/components/categories";
import HostCard from "@/components/host-card";
import { SearchBar } from "@/components/search-bar";
import { dummyHosts } from "@/constants/dummyData";
import { useColors } from '@/hooks/use-theme-color';
import { FlatList, Platform, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";



import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  const c = useColors();
  // const styles = makeStyles(c);


  const insets = useSafeAreaInsets();
  console.log(insets);
  console.log(Platform.OS);


  return (
    <SafeAreaView style={{
      backgroundColor: c.bg2,
      paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight : -24
    }} >
      <>
        <SearchBar />
        <Categories />
        <FlatList
          data={dummyHosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HostCard
              name={item.name}
              rating={item.rating}
              location={item.location}
              price={`${item.price}`}
              services={item.services}
              image={item.image}
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