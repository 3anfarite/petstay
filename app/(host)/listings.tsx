import { LocationCoords, LocationPickerModal } from '@/components/host/LocationPickerModal';
import { BackButton } from '@/components/ui/BackButton';
import { AppFonts, CardShadow } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { db } from '@/lib/firebaseConfig';
import { Listing, ListingService } from '@/lib/listingService';
import { uploadImage, uploadImages } from '@/lib/storageService';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SkeletonPulse = ({ width, height, borderRadius, style }: any) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;
    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    return <Animated.View style={[{ width, height, borderRadius: borderRadius || 8, backgroundColor: '#E0E0E0', opacity }, style]} />;
};

const ListingSkeleton = ({ c }: { c: any }) => (
    <View style={[{ backgroundColor: c.bg2, borderRadius: 20, overflow: 'hidden' }, CardShadow]}>
        <SkeletonPulse width="100%" height={180} borderRadius={0} />
        <View style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <SkeletonPulse width="55%" height={20} />
                <SkeletonPulse width={80} height={20} />
            </View>
            <SkeletonPulse width="40%" height={16} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <SkeletonPulse width={72} height={26} borderRadius={13} />
            </View>
        </View>
    </View>
);

export default function HostListings() {
    const c = useColors();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();

    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');

    // Modal Form States
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formLocationCoords, setFormLocationCoords] = useState<LocationCoords | undefined>(undefined);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [formAbout, setFormAbout] = useState('');
    const [formImage, setFormImage] = useState<string | null>(null);
    const [formGallery, setFormGallery] = useState<string[]>([]);
    const [formService, setFormService] = useState('Boarding');

    const AVAILABLE_SERVICES = ['Boarding', 'Daycare', 'Walking', 'Sitting', 'Training', 'Grooming'];

    const getServiceUnit = (service: string) => {
        switch (service?.toLowerCase()) {
            case 'boarding':
            case 'sitting':
                return '/night';
            case 'daycare':
                return '/day';
            case 'walking':
                return '/walk';
            default:
                return '/session';
        }
    };

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
        setFormLocationCoords(listing.locationCoords);
        setFormAbout(listing.about);
        setFormImage(listing.image || null);
        setFormGallery(listing.gallery || []);
        setFormService(listing.services?.[0] || 'Boarding');
        setIsFormVisible(true);
    };

    const openCreateForm = () => {
        setEditingId(null);
        setFormTitle('');
        setFormPrice('35');
        setFormLocation('');
        setFormLocationCoords(undefined);
        setFormAbout('');
        setFormImage(null);
        setFormGallery([]);
        setFormService('Boarding');
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

    const pickCoverImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormImage(result.assets[0].uri);
        }
    };

    const pickGalleryImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setFormGallery(prev => [...prev, ...newUris]);
        }
    };

    const removeGalleryImage = (index: number) => {
        setFormGallery(prev => prev.filter((_, i) => i !== index));
    };

    const submitForm = async () => {
        if (!user?.uid) return;
        if (!formTitle.trim() || !formPrice.trim() || !formLocation.trim() || !formImage) {
            Alert.alert(i18n.t('host_form_missing'), i18n.t('host_form_missing_desc'));
            return;
        }

        setIsSubmitting(true);
        try {
            const docSnap = await getDoc(doc(db, "users", user.uid));
            const profile = docSnap.exists() ? docSnap.data() : {};

            // Upload images to Firebase Storage so URLs persist across rebuilds
            const listingId = editingId || `new_${Date.now()}`;
            const uploadedCover = await uploadImage(formImage, `listings/${user.uid}/${listingId}/cover.jpg`);
            const uploadedGallery = formGallery.length > 0
                ? await uploadImages(formGallery, `listings/${user.uid}/${listingId}/gallery`)
                : [];

            const payload = {
                title: formTitle,
                price: parseFloat(formPrice) || 0,
                location: formLocation,
                locationCoords: formLocationCoords,
                about: formAbout,
                image: uploadedCover,
                gallery: uploadedGallery,
                services: [formService],
            };

            if (editingId) {
                await ListingService.updateListing(editingId, payload);
            } else {
                await ListingService.createListing({
                    hostId: user.uid,
                    hostName: profile.name || 'Host',
                    hostAvatar: profile.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Host')}&background=F3F4F6&color=374151&size=200`,
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

    const activeCount = listings.filter(l => l.status === 'active').length;
    const inactiveCount = listings.filter(l => l.status === 'inactive').length;
    const filteredListings = listings.filter(l => l.status === statusFilter);

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <BackButton style={styles.backBtn} icon="arrow-back" />
                    <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_listings_title')}</Text>
                    <TouchableOpacity onPress={openCreateForm} style={[styles.addButton, { backgroundColor: c.primary }]}>
                        <Ionicons name="add" size={22} color="white" />
                    </TouchableOpacity>
                </View>
                {!isLoading && listings.length > 0 && (
                    <Text style={[styles.listingCount, { color: c.textMuted }]}>
                        {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
                    </Text>
                )}
            </View>

            {/* Filter Tabs */}
            {!isLoading && listings.length > 0 && (
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterTab, { backgroundColor: statusFilter === 'active' ? c.primary : c.bg }]}
                        onPress={() => setStatusFilter('active')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterTabText, { color: statusFilter === 'active' ? 'white' : c.textMuted }]}>
                            {i18n.t('host_card_status_active', { defaultValue: 'Active' })} ({activeCount})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, { backgroundColor: statusFilter === 'inactive' ? c.primary : c.bg }]}
                        onPress={() => setStatusFilter('inactive')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterTabText, { color: statusFilter === 'inactive' ? 'white' : c.textMuted }]}>
                            {i18n.t('host_card_status_inactive', { defaultValue: 'Inactive' })} ({inactiveCount})
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {isLoading ? (
                <View style={styles.listContent}>
                    <ListingSkeleton c={c} />
                    <ListingSkeleton c={c} />
                </View>
            ) : (
                <FlatList
                    data={filteredListings}
                    keyExtractor={item => item.id!}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: c.primary + '12' }]}>
                                <Ionicons name="storefront-outline" size={48} color={c.primary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: c.text }]}>
                                {statusFilter === 'inactive'
                                    ? i18n.t('host_listings_no_inactive', { defaultValue: 'No inactive listings' })
                                    : i18n.t('host_listings_empty')}
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: c.textMuted }]}>
                                {statusFilter === 'inactive'
                                    ? i18n.t('host_listings_no_inactive_desc', { defaultValue: 'All your listings are currently active' })
                                    : 'Create your first listing to start receiving bookings'}
                            </Text>
                            {statusFilter === 'active' && (
                                <TouchableOpacity
                                    style={[styles.emptyButton, { backgroundColor: c.primary }]}
                                    onPress={openCreateForm}
                                >
                                    <Ionicons name="add" size={20} color="white" />
                                    <Text style={styles.emptyButtonText}>{i18n.t('host_listings_new')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => {
                        const isActive = item.status === 'active';
                        const servicesList = item.services || [];
                        return (
                            <TouchableOpacity
                                style={[styles.card, { backgroundColor: c.bg2 }]}
                                activeOpacity={0.95}
                                onLongPress={() => handleDeleteListing(item.id!)}
                                delayLongPress={600}
                            >
                                {/* Cover Image with Overlays */}
                                {item.image ? (
                                    <View style={styles.cardImageContainer}>
                                        <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" />
                                        {/* Status Badge */}
                                        <View style={[styles.statusBadge, { backgroundColor: isActive ? 'rgba(30,142,62,0.85)' : 'rgba(217,48,37,0.85)' }]}>
                                            <View style={[styles.statusDot, { backgroundColor: 'white' }]} />
                                            <Text style={styles.statusBadgeText}>
                                                {isActive ? i18n.t('host_card_status_active') : i18n.t('host_card_status_inactive')}
                                            </Text>
                                        </View>
                                        {/* Edit Overlay Button */}
                                        <TouchableOpacity
                                            style={styles.editOverlay}
                                            onPress={() => openEditForm(item)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="pencil" size={14} color="white" />
                                            <Text style={styles.editOverlayText}>{i18n.t('host_action_edit')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={[styles.cardImagePlaceholder, { backgroundColor: c.bg }]}>
                                        <Ionicons name="image-outline" size={32} color={c.border} />
                                        <View style={[styles.statusBadge, { backgroundColor: isActive ? 'rgba(30,142,62,0.85)' : 'rgba(217,48,37,0.85)' }]}>
                                            <View style={[styles.statusDot, { backgroundColor: 'white' }]} />
                                            <Text style={styles.statusBadgeText}>
                                                {isActive ? i18n.t('host_card_status_active') : i18n.t('host_card_status_inactive')}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.editOverlay}
                                            onPress={() => openEditForm(item)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="pencil" size={14} color="white" />
                                            <Text style={styles.editOverlayText}>{i18n.t('host_action_edit')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Card Body */}
                                <View style={styles.cardBody}>
                                    <View style={styles.titleRow}>
                                        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
                                        <Text style={[styles.priceAmount, { color: c.text }]}>
                                            {item.price} <Text style={[styles.priceCurrency, { color: c.textMuted }]}>MAD{getServiceUnit(item.services?.[0])}</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.locationRow}>
                                        <Ionicons name="location-outline" size={14} color={c.textMuted} />
                                        <Text style={[styles.cardLocation, { color: c.textMuted }]} numberOfLines={1}>{item.location}</Text>
                                    </View>
                                    {servicesList.length > 0 && (
                                        <View style={styles.servicesRow}>
                                            {servicesList.slice(0, 3).map((s: string) => (
                                                <View key={s} style={[styles.serviceChip, { backgroundColor: c.primary + '10' }]}>
                                                    <Text style={[styles.serviceChipText, { color: c.primary }]}>
                                                        {i18n.t(`service_${s}`, { defaultValue: s })}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {/* Editor Modal */}
            <Modal visible={isFormVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: c.bg, paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
                    <View style={[styles.modalHeader, { backgroundColor: c.bg2, borderBottomColor: c.border }]}>
                        <TouchableOpacity onPress={() => setIsFormVisible(false)} style={[styles.modalCancel, { backgroundColor: c.bg }]}>
                            <Ionicons name="close" size={20} color={c.text} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: c.text }]}>{editingId ? i18n.t('host_form_edit_title') : i18n.t('host_form_new_title')}</Text>
                        <TouchableOpacity
                            onPress={submitForm}
                            disabled={isSubmitting}
                            style={[styles.saveBtn, { backgroundColor: c.primary, opacity: isSubmitting ? 0.6 : 1 }]}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.saveBtnText}>{i18n.t('host_form_save')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <View style={[styles.formSection, { backgroundColor: c.bg2 }]}>
                            <Text style={[styles.sectionLabel, { color: c.text }]}>{i18n.t('host_form_photos')}</Text>
                            <View style={styles.photoContainer}>
                                <TouchableOpacity style={[styles.mainPhotoPicker, { backgroundColor: c.bg, borderColor: c.border }]} onPress={pickCoverImage}>
                                    {formImage ? (
                                        <Image source={{ uri: formImage }} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
                                    ) : (
                                        <View style={styles.photoPlaceholder}>
                                            <View style={[styles.photoIconCircle, { backgroundColor: c.primary + '15' }]}>
                                                <Ionicons name="camera" size={28} color={c.primary} />
                                            </View>
                                            <Text style={[styles.photoPlaceholderText, { color: c.textMuted }]}>{i18n.t('host_form_add_cover')}</Text>
                                            <Text style={[styles.photoPlaceholderHint, { color: c.border }]}>Tap to upload</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                                    {formGallery.map((uri, i) => (
                                        <View key={i} style={[styles.galleryThumbnail, { backgroundColor: c.bg, borderColor: c.border }]}>
                                            <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                                            <TouchableOpacity style={styles.removeGalleryBtn} onPress={() => removeGalleryImage(i)}>
                                                <Ionicons name="close-circle" size={22} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <TouchableOpacity onPress={pickGalleryImages} style={[styles.galleryThumbnail, { backgroundColor: c.bg, borderColor: c.border }]}>
                                        <Ionicons name="add" size={24} color={c.textMuted} />
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </View>

                        <View style={[styles.formSection, { backgroundColor: c.bg2 }]}>
                            <Text style={[styles.sectionLabel, { color: c.text }]}>Listing Details</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                                {AVAILABLE_SERVICES.map(service => (
                                    <TouchableOpacity
                                        key={service}
                                        style={[styles.serviceSelectChip, { backgroundColor: formService === service ? c.primary : c.bg, borderColor: formService === service ? c.primary : c.border }]}
                                        onPress={() => setFormService(service)}
                                    >
                                        <Text style={{ color: formService === service ? 'white' : c.text, fontFamily: formService === service ? AppFonts.bodyBold : AppFonts.body }}>
                                            {i18n.t(`service_${service}`, { defaultValue: service })}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <View style={[styles.inputGroup, { backgroundColor: c.bg, borderColor: c.border }]}>
                                <Ionicons name="text-outline" size={20} color={c.textMuted} />
                                <TextInput style={[styles.groupInput, { color: c.text }]} placeholder={i18n.t('host_form_title_ph')} placeholderTextColor={c.textMuted} value={formTitle} onChangeText={setFormTitle} />
                            </View>
                            <TouchableOpacity style={[styles.inputGroup, { backgroundColor: c.bg, borderColor: c.border }]} onPress={() => setIsMapVisible(true)}>
                                <Ionicons name="location-outline" size={20} color={c.textMuted} />
                                <Text style={[styles.groupInput, { color: formLocation ? c.text : c.textMuted }]} numberOfLines={1}>{formLocation || i18n.t('host_form_location_ph')}</Text>
                                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                            </TouchableOpacity>
                            <View style={[styles.inputGroup, { backgroundColor: c.bg, borderColor: c.border }]}>
                                <Text style={{ fontSize: 18, color: c.textMuted }}>MAD</Text>
                                <TextInput style={[styles.groupInput, { color: c.text }]} placeholder={i18n.t('host_form_price_ph')} placeholderTextColor={c.textMuted} keyboardType="numeric" value={formPrice} onChangeText={setFormPrice} />
                                <Text style={{ fontSize: 13, color: c.textMuted, fontFamily: AppFonts.body }}>{getServiceUnit(formService)}</Text>
                            </View>
                        </View>

                        <View style={[styles.formSection, { backgroundColor: c.bg2 }]}>
                            <Text style={[styles.sectionLabel, { color: c.text }]}>{i18n.t('host_form_about')}</Text>
                            <TextInput style={[styles.textArea, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]} placeholder={i18n.t('host_form_about_ph')} placeholderTextColor={c.textMuted} multiline numberOfLines={5} textAlignVertical="top" value={formAbout} onChangeText={setFormAbout} />
                        </View>

                        <LocationPickerModal visible={isMapVisible} onClose={() => setIsMapVisible(false)} initialCoords={formLocationCoords} onConfirm={(addr, coords) => { setFormLocation(addr); setFormLocationCoords(coords); setIsMapVisible(false); }} />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontFamily: AppFonts.title },
    addButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    listingCount: { fontSize: 14, fontFamily: AppFonts.body, marginTop: 8, textAlign: 'center' },
    // Filter Tabs
    filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
    filterTab: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    filterTabText: { fontSize: 14, fontFamily: AppFonts.bodyBold },
    listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
    // Card
    card: { borderRadius: 20, overflow: 'hidden', ...CardShadow },
    cardImageContainer: { width: '100%', height: 180, position: 'relative' },
    cardImage: { width: '100%', height: '100%' },
    cardImagePlaceholder: { width: '100%', height: 140, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    statusBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusBadgeText: { color: 'white', fontSize: 11, fontFamily: AppFonts.bodyBold, textTransform: 'uppercase', letterSpacing: 0.5 },
    editOverlay: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    editOverlayText: { color: 'white', fontSize: 12, fontFamily: AppFonts.bodyBold },
    cardBody: { padding: 16 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardTitle: { fontSize: 17, fontFamily: AppFonts.title, flex: 1, marginRight: 12 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
    cardLocation: { fontSize: 13, fontFamily: AppFonts.body, flex: 1 },
    priceAmount: { fontSize: 17, fontFamily: AppFonts.title },
    priceCurrency: { fontSize: 12, fontFamily: AppFonts.body, fontWeight: '400' },
    servicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    serviceChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 13 },
    serviceChipText: { fontSize: 12, fontFamily: AppFonts.bodyBold },
    // Empty State
    emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
    emptyIconCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 20, fontFamily: AppFonts.title, marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontSize: 15, fontFamily: AppFonts.body, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    emptyButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, gap: 8 },
    emptyButtonText: { color: 'white', fontFamily: AppFonts.bodyBold, fontSize: 16 },
    // Form Modal
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, ...Platform.select({ ios: { paddingTop: 20 } }) },
    modalCancel: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontFamily: AppFonts.title },
    saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    saveBtnText: { color: 'white', fontFamily: AppFonts.bodyBold, fontSize: 15 },
    formContent: { padding: 20, paddingBottom: 60, gap: 24 },
    formSection: { borderRadius: 20, padding: 20, ...CardShadow },
    sectionLabel: { fontSize: 17, fontFamily: AppFonts.title, marginBottom: 16 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, gap: 12 },
    serviceSelectChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    groupInput: { flex: 1, fontSize: 16, fontFamily: AppFonts.body },
    textArea: { borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 16, fontFamily: AppFonts.body, minHeight: 140 },
    photoContainer: { gap: 16 },
    mainPhotoPicker: { width: '100%', height: 180, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    photoPlaceholder: { alignItems: 'center', gap: 8 },
    photoIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    photoPlaceholderText: { fontSize: 15, fontFamily: AppFonts.bodyBold },
    photoPlaceholderHint: { fontSize: 13, fontFamily: AppFonts.body },
    galleryRow: { flexDirection: 'row', gap: 12 },
    galleryThumbnail: { width: 80, height: 80, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    removeGalleryBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12 },
});

