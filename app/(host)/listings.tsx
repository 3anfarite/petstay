import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HostListings() {
    const c = useColors();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_listings_title')}</Text>
            </View>
            <FlatList
                data={[
                    { id: '1', title: 'Sunny Living Room', location: 'Paris 11e, France', image: 'https://images.unsplash.com/photo-1517423568366-eb51fb77d418?w=200&h=200&fit=crop', status: i18n.t('host_card_status_active') },
                    { id: '2', title: 'Fenced Garden Area', location: 'Lyon, France', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop', status: i18n.t('host_card_status_active') },
                ]}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: c.bg2 }]}>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <Image source={{ uri: item.image }} style={styles.image} />
                            <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
                                <View>
                                    <Text style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
                                    <Text style={[styles.cardLocation, { color: c.textMuted }]}>{item.location}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.statusBadge, { backgroundColor: c.success + '20' }]}>
                                        <Text style={[styles.statusText, { color: c.success }]}>{item.status}</Text>
                                    </View>
                                </View>
                            </View>

                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 24,
        gap: 24,
    },
    card: {
        borderRadius: 20,
        // No background color set here as it's passed inline or matches bg
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardLocation: {
        fontSize: 14,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
