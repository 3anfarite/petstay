import HostCard from "@/components/host-card";
import { useColors } from '@/hooks/use-theme-color';
import { useScrollToTop } from '@react-navigation/native';
import React, { useRef } from 'react';
import { FlatList, RefreshControl } from "react-native";

interface Host {
    id: string;
    name: string;
    rating?: number;
    location: string;
    price: number;
    services: string[];
    image: string;
    verified: boolean;
}

interface HostListProps {
    hosts: Host[];
    onHostPress: (id: string) => void;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export function HostList({ hosts, onHostPress, refreshing = false, onRefresh }: HostListProps) {
    const c = useColors();
    const scrollRef = useRef(null);
    useScrollToTop(scrollRef);

    return (
        <FlatList
            ref={scrollRef}
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
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} /> : undefined}
        />
    );
}
