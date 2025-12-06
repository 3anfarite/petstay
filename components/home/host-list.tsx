import HostCard from "@/components/host-card";
import { FlatList } from "react-native";

interface Host {
    id: string;
    name: string;
    rating: number;
    location: string;
    price: number;
    services: string[];
    image: string;
    verified: boolean;
}

interface HostListProps {
    hosts: Host[];
    onHostPress: (id: string) => void;
}

export function HostList({ hosts, onHostPress }: HostListProps) {
    return (
        <FlatList
            data={hosts}
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
                    onPress={() => onHostPress(item.id)}
                />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
            style={{ flex: 1 }}
        />
    );
}
