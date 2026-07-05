import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { PetProfile, PetService } from '@/lib/petService';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

export default function PetsScreen() {
    const c = useColors();
    const router = useRouter();
    const { user } = useAuthStore();
    
    const { 
        data: pets = [], 
        isLoading: loading, 
        isRefetching: refreshing, 
        refetch 
    } = useQuery({
        queryKey: ['pets', user?.uid],
        queryFn: () => PetService.getUserPets(user!.uid),
        enabled: !!user?.uid,
    });

    const onRefresh = () => {
        refetch();
    };

    const renderItem = ({ item }: { item: PetProfile }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: c.bg2 }]}
            onPress={() => router.push(`/pets/${item.id}` as any)}
        >
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: c.bg }]}>
                        <Ionicons name="paw" size={32} color={c.textMuted} />
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.name, { color: c.text }]}>{item.name}</Text>
                <Text style={[styles.breed, { color: c.textMuted }]}>{item.breed} • {item.age}</Text>

                <View style={styles.chipsRow}>
                    <View style={[styles.chip, { backgroundColor: c.bg }]}>
                        <Text style={[styles.chipText, { color: c.textMuted }]}>{item.type}</Text>
                    </View>
                    <View style={[styles.chip, { backgroundColor: c.bg }]}>
                        <Text style={[styles.chipText, { color: c.textMuted }]}>{item.weight} kg</Text>
                    </View>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: c.bg }]}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={c.primary} />
                </View>
            ) : (
                <FlatList
                    data={pets}
                    keyExtractor={(item) => item.id!}
                    contentContainerStyle={pets.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : styles.listContent}
                    renderItem={renderItem}
                    contentInsetAdjustmentBehavior="automatic"
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="paw-outline" size={64} color={c.textMuted} />
                            <Text style={[styles.emptyTitle, { color: c.text }]}>{i18n.t('pets_empty_title', { defaultValue: 'No Pets Added Yet' })}</Text>
                            <Text style={[styles.emptySub, { color: c.textMuted }]}>
                                {i18n.t('pets_empty_sub', { defaultValue: "Add your pets so hosts know who they'll be taking care of!" })}
                            </Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
                    }
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: c.primary }]}
                onPress={() => router.push('/pets/new' as any)}
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // For FAB
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 16,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontFamily: AppFonts.bodyBold,
        marginBottom: 2,
    },
    breed: {
        fontSize: 14,
        fontFamily: AppFonts.body,
        marginBottom: 8,
    },
    chipsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    chipText: {
        fontSize: 12,
        fontFamily: AppFonts.bodyBold,
        textTransform: 'capitalize',
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: AppFonts.bodyBold,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        fontFamily: AppFonts.body,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    }
});
