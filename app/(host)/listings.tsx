import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { db } from '@/lib/firebaseConfig';
import { Listing, ListingService } from '@/lib/listingService';
import { uploadImage, uploadImages } from '@/lib/storageService';
import { useAuthStore } from '@/store/useAuthStore';
import { LocationCoords, LocationPickerModal } from '@/components/host/LocationPickerModal';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    <View style={{ backgroundColor: c.bg2, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
        <SkeletonPulse width={90} height={24} borderRadius={12} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            <View style={{ flex: 1, gap: 8 }}>
                <SkeletonPulse width="70%" height={20} />
                <SkeletonPulse width="50%" height={16} />
            </View>
            <SkeletonPulse width={70} height={50} borderRadius={14} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <SkeletonPulse width={80} height={28} borderRadius={10} />
            <SkeletonPulse width={80} height={28} borderRadius={10} />
            <SkeletonPulse width={80} height={28} borderRadius={10} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <SkeletonPulse width="80%" height={44} borderRadius={14} style={{ flex: 1 }} />
            <SkeletonPulse width={48} height={44} borderRadius={14} />
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
                    services: profile.services?.length ? profile.services : ['Boarding'],
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
                <View style={styles.listContent}>
                    <ListingSkeleton c={c} />
                    <ListingSkeleton c={c} />
                </View>
            ) : (
                <FlatList
                    data={listings}
                    keyExtractor={item => item.id!}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={[styles.emptyText, { color: c.textMuted }]}>{i18n.t('host_listings_empty')}</Text>}
                    renderItem={({ item }) => {
                        const isActive = item.status === 'active';
                        const servicesList = item.services || [];
                        return (
                            <View style={[styles.card, { backgroundColor: c.bg2 }]}>
                                {/* Status Pill */}
                                <View style={[styles.statusPill, { backgroundColor: isActive ? '#E6F4EA' : '#FCE8E6' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: isActive ? '#1E8E3E' : '#D93025' }]} />
                                    <Text style={[styles.statusText, { color: isActive ? '#1E8E3E' : '#D93025' }]}>
                                        {isActive ? i18n.t('host_card_status_active') : i18n.t('host_card_status_inactive')}
                                    </Text>
                                </View>

                                {/* Title + Price */}
                                <View style={styles.titleRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="location" size={15} color={c.textMuted} />
                                            <Text style={[styles.cardLocation, { color: c.textMuted }]} numberOfLines={1}>{item.location}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.priceChip, { backgroundColor: c.bg }]}>
                                        <Text style={[styles.priceText, { color: c.text }]}>${item.price}</Text>
                                        <Text style={[styles.nightText, { color: c.textMuted }]}>{getServiceUnit(item.services?.[0])}</Text>
                                    </View>
                                </View>

                                {/* Services */}
                                {servicesList.length > 0 && (
                                    <View style={styles.servicesRow}>
                                        {servicesList.slice(0, 4).map((s: string) => (
                                            <View key={s} style={[styles.serviceChip, { backgroundColor: c.bg }]}>
                                                <Ionicons name="checkmark-circle" size={14} color={c.primary} />
                                                <Text style={[styles.serviceChipText, { color: c.text }]}>{i18n.t(`service_${s}`, { defaultValue: s })}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Actions */}
                                <View style={styles.cardActions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: c.primary }]}
                                        onPress={() => openEditForm(item)}
                                    >
                                        <Ionicons name="pencil" size={16} color="white" />
                                        <Text style={[styles.actionBtnText, { color: 'white' }]}>{i18n.t('host_action_edit')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtnOutline, { borderColor: c.border }]}
                                        onPress={() => handleDeleteListing(item.id!)}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#D93025" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                />
            )}

            {/* Editor Modal */}
            <Modal visible={isFormVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: c.bg2 }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
                        <TouchableOpacity onPress={() => setIsFormVisible(false)} style={styles.modalCancel}>
                            <Ionicons name="close" size={24} color={c.text} />
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

                        {/* Section: Photos */}
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
                                            <TouchableOpacity
                                                style={styles.removeGalleryBtn}
                                                onPress={() => removeGalleryImage(i)}
                                            >
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

                        {/* Section: Details */}
                        <View style={[styles.formSection, { backgroundColor: c.bg2 }]}>
                            <Text style={[styles.sectionLabel, { color: c.text }]}>Listing Details</Text>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                                {AVAILABLE_SERVICES.map(service => (
                                    <TouchableOpacity 
                                        key={service}
                                        style={[
                                            styles.serviceSelectChip, 
                                            { 
                                                backgroundColor: formService === service ? c.primary : c.bg,
                                                borderColor: formService === service ? c.primary : c.border
                                            }
                                        ]}
                                        onPress={() => setFormService(service)}
                                    >
                                        <Text style={{ 
                                            color: formService === service ? 'white' : c.text,
                                            fontFamily: formService === service ? AppFonts.bodyBold : AppFonts.body
                                        }}>
                                            {i18n.t(`service_${service}`, { defaultValue: service })}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={[styles.inputGroup, { backgroundColor: c.bg, borderColor: c.border }]}>
                                <Ionicons name="text-outline" size={20} color={c.textMuted} />
                                <TextInput
                                    style={[styles.groupInput, { color: c.text }]}
                                    placeholder={i18n.t('host_form_title_ph')}
                                    placeholderTextColor={c.textMuted}
                                    value={formTitle}
                                    onChangeText={setFormTitle}
                                />
                            </View>

                            <TouchableOpacity 
                                style={[styles.inputGroup, { backgroundColor: c.bg, borderColor: c.border }]}
                                onPress={() => setIsMapVisible(true)}
                            >
                                <Ionicons name="location-outline" size={20} color={c.textMuted} />
                                <Text style={[styles.groupInput, { color: formLocation ? c.text : c.textMuted }]} numberOfLines={1}>
                                    {formLocation || i18n.t('host_form_location_ph')}
                                </Text>
                                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                            </TouchableOpacity>

                            <View style={[styles.inputGroup, { backgroundColor: c.bg, borderColor: c.border }]}>
                                <Text style={{ fontSize: 18, color: c.textMuted }}>$</Text>
                                <TextInput
                                    style={[styles.groupInput, { color: c.text }]}
                                    placeholder={i18n.t('host_form_price_ph')}
                                    placeholderTextColor={c.textMuted}
                                    keyboardType="numeric"
                                    value={formPrice}
                                    onChangeText={setFormPrice}
                                />
                                <Text style={{ fontSize: 13, color: c.textMuted, fontFamily: AppFonts.body }}>{getServiceUnit(formService)}</Text>
                            </View>
                        </View>

                        {/* Section: Description */}
                        <View style={[styles.formSection, { backgroundColor: c.bg2 }]}>
                            <Text style={[styles.sectionLabel, { color: c.text }]}>{i18n.t('host_form_about')}</Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
                                placeholder={i18n.t('host_form_about_ph')}
                                placeholderTextColor={c.textMuted}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                value={formAbout}
                                onChangeText={setFormAbout}
                            />
                        </View>

                        <LocationPickerModal
                            visible={isMapVisible}
                            onClose={() => setIsMapVisible(false)}
                            initialCoords={formLocationCoords}
                            onConfirm={(addr, coords) => {
                                setFormLocation(addr);
                                setFormLocationCoords(coords);
                                setIsMapVisible(false);
                            }}
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
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginBottom: 16,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontFamily: AppFonts.bodyBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: AppFonts.title,
        marginBottom: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardLocation: {
        fontSize: 14,
        fontFamily: AppFonts.body,
        flex: 1,
    },
    priceChip: {
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        marginLeft: 12,
    },
    priceText: {
        fontSize: 18,
        fontFamily: AppFonts.title,
    },
    nightText: {
        fontSize: 11,
        fontFamily: AppFonts.bodyBold,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    servicesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    serviceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    serviceChipText: {
        fontSize: 13,
        fontFamily: AppFonts.body,
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
        paddingVertical: 13,
        borderRadius: 14,
        gap: 8,
    },
    actionBtnOutline: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 14,
        borderWidth: 1,
    },
    actionBtnText: {
        fontSize: 14,
        fontFamily: AppFonts.bodyBold,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        fontFamily: AppFonts.body,
    },
    // Form Modal
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        ...Platform.select({
            ios: { paddingTop: 20 }
        }),
    },
    modalCancel: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: AppFonts.title,
    },
    saveBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    saveBtnText: {
        color: 'white',
        fontFamily: AppFonts.bodyBold,
        fontSize: 15,
    },
    formContent: {
        padding: 20,
        paddingBottom: 60,
        gap: 24,
    },
    formSection: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionLabel: {
        fontSize: 17,
        fontFamily: AppFonts.title,
        marginBottom: 16,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        gap: 12,
    },
    serviceSelectChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    groupInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: AppFonts.body,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        fontFamily: AppFonts.body,
        minHeight: 140,
    },
    photoContainer: {
        gap: 16,
    },
    mainPhotoPicker: {
        width: '100%',
        height: 180,
        borderRadius: 18,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    photoPlaceholder: {
        alignItems: 'center',
        gap: 8,
    },
    photoIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    photoPlaceholderText: {
        fontSize: 15,
        fontFamily: AppFonts.bodyBold,
    },
    photoPlaceholderHint: {
        fontSize: 13,
        fontFamily: AppFonts.body,
    },
    galleryRow: {
        flexDirection: 'row',
        gap: 12,
    },
    galleryThumbnail: {
        width: 80,
        height: 80,
        borderRadius: 14,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    removeGalleryBtn: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
    },
});
