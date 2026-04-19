import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { ListingService, Listing } from '@/lib/listingService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function HostListings() {
    const c = useColors();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal Form States
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formAbout, setFormAbout] = useState('');

    const fetchListings = async () => {
        if (!user?.uid) return;
        setIsLoading(true);
        try {
            const data = await ListingService.getHostListings(user.uid);
            setListings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, [user]);

    const openEditForm = (listing: Listing) => {
        setEditingId(listing.id!);
        setFormTitle(listing.title);
        setFormPrice(listing.price.toString());
        setFormLocation(listing.location);
        setFormAbout(listing.about);
        setIsFormVisible(true);
    };

    const openCreateForm = () => {
        setEditingId(null);
        setFormTitle('');
        setFormPrice('35');
        setFormLocation('');
        setFormAbout('');
        setIsFormVisible(true);
    };

    const handleDeleteListing = (id: string) => {
        Alert.alert(
            i18n.t('host_delete_title'),
            i18n.t('host_delete_desc'),
            [
                { text: i18n.t('host_delete_cancel'), style: "cancel" },
                { 
                    text: i18n.t('host_action_delete'), 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await ListingService.deleteListing(id);
                            fetchListings();
                        } catch (e) {
                            Alert.alert(i18n.t('host_form_error'), i18n.t('host_form_error_delete'));
                        }
                    } 
                }
            ]
        );
    };

    const submitForm = async () => {
        if (!user?.uid) return;
        if (!formTitle.trim() || !formPrice.trim() || !formLocation.trim()) {
            Alert.alert(i18n.t('host_form_missing'), i18n.t('host_form_missing_desc'));
            return;
        }

        setIsSubmitting(true);
        try {
            const docSnap = await getDoc(doc(db, "users", user.uid));
            const profile = docSnap.exists() ? docSnap.data() : {};
            
            const payload = {
                title: formTitle,
                price: parseFloat(formPrice) || 0,
                location: formLocation,
                about: formAbout,
            };

            if (editingId) {
                await ListingService.updateListing(editingId, payload);
            } else {
                await ListingService.createListing({
                    hostId: user.uid,
                    hostName: profile.name || 'Host',
                    hostAvatar: profile.profilePic || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
                    services: profile.services?.length ? profile.services : ['Boarding'],
                    image: 'https://images.unsplash.com/photo-1517423568366-eb51fb77d418?w=800&h=600&fit=crop',
                    gallery: [
                        'https://images.unsplash.com/photo-1517423568366-eb51fb77d418?w=800&h=600&fit=crop',
                        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=600&fit=crop'
                    ],
                    verified: true,
                    status: 'active',
                    ...payload,
                });
            }
            
            setIsFormVisible(false);
            fetchListings();
        } catch (error) {
            console.error(error);
            Alert.alert(i18n.t('host_form_error'), i18n.t('host_form_error_save'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={c.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openCreateForm} style={[styles.addButton, { backgroundColor: c.text }]}>
                        <Ionicons name="add" size={20} color={c.bg} />
                        <Text style={[styles.addText, { color: c.bg }]}>{i18n.t('host_listings_new')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_listings_title')}</Text>
            </View>
            
            {isLoading ? (
                <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={listings}
                    keyExtractor={item => item.id!}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={[styles.emptyText, { color: c.textMuted }]}>{i18n.t('host_listings_empty')}</Text>}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: item.image }} style={styles.image} />
                                <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? c.success + 'E6' : c.error + 'E6' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? '#4CAF50' : '#F44336' }]} />
                                    <Text style={[styles.statusText, { color: 'white' }]}>
                                        {item.status === 'active' ? i18n.t('host_card_status_active') : i18n.t('host_card_status_inactive')}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
                                        <View style={styles.locationRow}>
                                            <Ionicons name="location-outline" size={14} color={c.textMuted} />
                                            <Text style={[styles.cardLocation, { color: c.textMuted }]}>{item.location}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.priceContainer}>
                                        <Text style={[styles.priceText, { color: c.text }]}>${item.price}</Text>
                                        <Text style={[styles.nightText, { color: c.textMuted }]}>{i18n.t('host_night')}</Text>
                                    </View>
                                </View>

                                <View style={[styles.divider, { backgroundColor: c.border }]} />

                                <View style={styles.cardActions}>
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { backgroundColor: c.primary + '15' }]}
                                        onPress={() => openEditForm(item)}
                                    >
                                        <Ionicons name="pencil" size={18} color={c.primary} />
                                        <Text style={[styles.actionBtnText, { color: c.primary }]}>{i18n.t('host_action_edit')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { backgroundColor: '#F4433615' }]}
                                        onPress={() => handleDeleteListing(item.id!)}
                                    >
                                        <Ionicons name="trash" size={18} color="#F44336" />
                                        <Text style={[styles.actionBtnText, { color: '#F44336' }]}>{i18n.t('host_action_delete')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                />
            )}

            {/* Editor Modal */}
            <Modal visible={isFormVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: c.bg2 }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
                        <TouchableOpacity onPress={() => setIsFormVisible(false)} style={styles.modalCancel}>
                            <Text style={{ color: c.textMuted, fontSize: 16 }}>{i18n.t('host_form_cancel')}</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: c.text }]}>{editingId ? i18n.t('host_form_edit_title') : i18n.t('host_form_new_title')}</Text>
                        <TouchableOpacity onPress={submitForm} disabled={isSubmitting} style={styles.modalSave}>
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={c.primary} />
                            ) : (
                                <Text style={{ color: c.primary, fontWeight: 'bold', fontSize: 16 }}>{i18n.t('host_form_save')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
                        
                        {/* Image Upload Mock UI */}
                        <Text style={[styles.inputLabel, { color: c.text }]}>{i18n.t('host_form_photos')}</Text>
                        <View style={styles.photoContainer}>
                            <TouchableOpacity style={[styles.mainPhotoPicker, { backgroundColor: c.bg, borderColor: c.border }]}>
                                <Ionicons name="camera" size={32} color={c.textMuted} />
                                <Text style={{ color: c.textMuted, marginTop: 8 }}>{i18n.t('host_form_add_cover')}</Text>
                            </TouchableOpacity>
                            <View style={styles.galleryRow}>
                                {[1, 2, 3].map((i) => (
                                    <View key={i} style={[styles.galleryThumbnail, { backgroundColor: c.bg, borderColor: c.border }]}>
                                        <Ionicons name="add" size={24} color={c.border} />
                                    </View>
                                ))}
                            </View>
                        </View>

                        <Text style={[styles.inputLabel, { color: c.text }]}>{i18n.t('host_form_title_label')}</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
                            placeholder={i18n.t('host_form_title_ph')}
                            placeholderTextColor={c.textMuted}
                            value={formTitle}
                            onChangeText={setFormTitle}
                        />

                        <Text style={[styles.inputLabel, { color: c.text }]}>{i18n.t('host_form_location_label')}</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
                            placeholder={i18n.t('host_form_location_ph')}
                            placeholderTextColor={c.textMuted}
                            value={formLocation}
                            onChangeText={setFormLocation}
                        />

                        <Text style={[styles.inputLabel, { color: c.text }]}>{i18n.t('host_form_price')}</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
                            placeholder={i18n.t('host_form_price_ph')}
                            placeholderTextColor={c.textMuted}
                            keyboardType="numeric"
                            value={formPrice}
                            onChangeText={setFormPrice}
                        />

                        <Text style={[styles.inputLabel, { color: c.text }]}>{i18n.t('host_form_about')}</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
                            placeholder={i18n.t('host_form_about_ph')}
                            placeholderTextColor={c.textMuted}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={formAbout}
                            onChangeText={setFormAbout}
                        />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 32,
        fontFamily: AppFonts.title,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 6,
    },
    addText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 24,
    },
    card: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    imageContainer: {
        width: '100%',
        height: 180,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E0E0E0',
    },
    statusBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontFamily: AppFonts.bodyBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontFamily: AppFonts.title,
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cardLocation: {
        fontSize: 14,
        fontFamily: AppFonts.body,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 22,
        fontFamily: AppFonts.title,
    },
    nightText: {
        fontSize: 12,
        fontFamily: AppFonts.body,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 16,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontFamily: AppFonts.bodyBold,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
    // Form Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        ...Platform.select({
            ios: { paddingTop: 24 }
        })
    },
    modalCancel: {
        padding: 4,
    },
    modalSave: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    formContent: {
        padding: 20,
        paddingBottom: 40,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 120,
    },
    photoContainer: {
        gap: 12,
    },
    mainPhotoPicker: {
        width: '100%',
        height: 160,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryRow: {
        flexDirection: 'row',
        gap: 12,
    },
    galleryThumbnail: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
