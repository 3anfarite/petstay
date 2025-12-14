import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WishlistScreen() {
    const c = useColors();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Mock empty state for now
    const wishlists = [];

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: c.text }]}>{i18n.t('wishlist_title')}</Text>
            </View>

            <View style={styles.content}>
                {wishlists.length === 0 ? (
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
                ) : (
                    // TODO: Implement list of favorite hosts
                    <View />
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
        paddingVertical: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    content: {
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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    exploreButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
