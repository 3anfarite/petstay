import { useLanguage } from '@/components/LanguageProvider';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { db } from '@/lib/firebaseConfig';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationCoords, LocationPickerModal } from '@/components/host/LocationPickerModal';
import { AppFonts, CardShadow } from '@/constants/theme';
import { ListingService } from '@/lib/listingService';

import { AuthService } from '@/lib/authService';
import { Alert } from 'react-native';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=F3F4F6&color=374151&size=256';

const SkeletonView = ({ width, height, borderRadius, style }: any) => {
    const c = useColors();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7]
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: borderRadius || 8,
                    backgroundColor: c.border,
                    opacity
                },
                style
            ]}
        />
    );
};

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    showArrow?: boolean;
}

const SettingItem: React.FC<MenuItemProps & { subValue?: string }> = ({ icon, label, value, subValue, onPress, isDestructive, showArrow = true }) => {
    const c = useColors();
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={[settingItemStyles.item, { borderBottomColor: c.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[settingItemStyles.iconBox, { backgroundColor: isDestructive ? c.error + '10' : c.primary + '10' }]}>
                <Ionicons name={icon} size={20} color={isDestructive ? c.error : c.primary} />
            </View>
            <View style={settingItemStyles.content}>
                <Text style={[settingItemStyles.label, { color: c.text }]}>{label}</Text>
                {subValue && <Text style={[settingItemStyles.subValue, { color: c.textMuted }]}>{subValue}</Text>}
            </View>
            <View style={settingItemStyles.right}>
                {value && !subValue && <Text style={[settingItemStyles.value, { color: c.textMuted }]}>{value}</Text>}
                {onPress && showArrow && <Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
            </View>
        </Container>
    );
};

const settingItemStyles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: 15,
        fontFamily: AppFonts.bodyBold,
    },
    subValue: {
        fontSize: 13,
        fontFamily: AppFonts.body,
        marginTop: 2,
    },
    value: {
        fontSize: 14,
        fontFamily: AppFonts.body,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    }
});

export default function HostProfile() {
    const c = useColors();
    const insets = useSafeAreaInsets();
    const { locale, setLocale } = useLanguage();
    const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
    
    // Capacity Modal State
    const [isCapacityModalVisible, setCapacityModalVisible] = useState(false);
    const [editingCapacity, setEditingCapacity] = useState(1);

    // Location Modal State
    const [isLocationModalVisible, setLocationModalVisible] = useState(false);

    // Accepted Pets Modal State
    const [isAcceptedPetsModalVisible, setAcceptedPetsModalVisible] = useState(false);
    const [editingAcceptedPets, setEditingAcceptedPets] = useState<string[]>([]);

    // Vacation Modal State
    const [isVacationModalVisible, setVacationModalVisible] = useState(false);
    const [editingVacationDates, setEditingVacationDates] = useState<string[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const router = useRouter(); // Added router for navigation
    const params = useLocalSearchParams();

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const openLanguageModal = () => {
        setLanguageModalVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeLanguageModal = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => setLanguageModalVisible(false));
    };

    const changeLanguage = (lang: string) => {
        setLocale(lang);
        closeLanguageModal();
    };

    const handleLogout = async () => {
        try {
            await AuthService.signOutUser();
            // Note: The global Auth listener will automatically handle routing us back to the Welcome screen!
        } catch (error) {
            console.error("Failed to sign out:", error);
        }
    };

    const openCapacityModal = () => {
        setEditingCapacity(profileData?.maxPetCapacity || 1);
        setCapacityModalVisible(true);
    };

    const saveCapacity = async () => {
        if (!user?.uid) return;
        try {
            setIsLoadingProfile(true);
            setCapacityModalVisible(false);
            await updateDoc(doc(db, "users", user.uid), {
                maxPetCapacity: editingCapacity
            });
            setProfileData((prev: any) => ({ ...prev, maxPetCapacity: editingCapacity }));
        } catch (error) {
            console.error("Failed to update capacity", error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleSaveLocation = async (address: string, coords: LocationCoords) => {
        if (!user?.uid) return;
        try {
            setIsLoadingProfile(true);
            await updateDoc(doc(db, "users", user.uid), {
                location: address,
                locationCoords: coords
            });
            setProfileData((prev: any) => ({ ...prev, location: address, locationCoords: coords }));
            setLocationModalVisible(false);
        } catch (error) {
            console.error("Failed to update location", error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const openAcceptedPetsModal = () => {
        setEditingAcceptedPets(profileData?.petsAllowed || []);
        setAcceptedPetsModalVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeAcceptedPetsModal = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => setAcceptedPetsModalVisible(false));
    };

    const saveAcceptedPets = async () => {
        if (!user?.uid) return;
        try {
            setIsLoadingProfile(true);
            closeAcceptedPetsModal();
            await updateDoc(doc(db, "users", user.uid), {
                petsAllowed: editingAcceptedPets
            });
            setProfileData((prev: any) => ({ ...prev, petsAllowed: editingAcceptedPets }));
        } catch (error) {
            console.error("Failed to update accepted pets", error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const toggleAcceptedPet = (petType: string) => {
        setEditingAcceptedPets(prev => 
            prev.includes(petType) 
            ? prev.filter(p => p !== petType) 
            : [...prev, petType]
        );
    };

    const openVacationModal = () => {
        setEditingVacationDates(profileData?.vacationDates || []);
        setCurrentMonth(new Date());
        setVacationModalVisible(true);
    };

    const saveVacationDates = async () => {
        if (!user?.uid) return;
        try {
            setIsLoadingProfile(true);
            setVacationModalVisible(false);
            await updateDoc(doc(db, "users", user.uid), {
                vacationDates: editingVacationDates
            });
            setProfileData((prev: any) => ({ ...prev, vacationDates: editingVacationDates }));
        } catch (error) {
            console.error("Failed to update vacation dates", error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const toggleVacationDate = (date: Date) => {
        const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        setEditingVacationDates(prev => 
            prev.includes(dateStr) 
            ? prev.filter(d => d !== dateStr) 
            : [...prev, dateStr]
        );
    };

    const handlePreview = async () => {
        if (!user?.uid) return;
        router.push(`/host-profile/${user.uid}`);
    };

    const calendarDays = React.useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayIndex = firstDay.getDay(); 

        const days = [];
        for (let i = 0; i < startingDayIndex; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [currentMonth]);

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentMonth(newDate);
    };

    const screenHeight = Dimensions.get('window').height;
    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [screenHeight, 0],
    });

    const { user } = useAuthStore();
    const [profileData, setProfileData] = useState<any>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const [refreshing, setRefreshing] = useState(false);
    const scrollRef = useRef(null);
    useScrollToTop(scrollRef);

    const fetchProfile = async () => {
        if (!user?.uid) return;
        try {
            const docSnap = await getDoc(doc(db, "users", user.uid));
            if (docSnap.exists()) {
                setProfileData(docSnap.data());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingProfile(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user, locale]); // added locale to re-fetch/re-render if needed

    useEffect(() => {
        if (params.openVacation === 'true' && profileData) {
            openVacationModal();
            // Clear the param from the URL so it doesn't re-open on every render
            router.setParams({ openVacation: '' });
        }
    }, [params.openVacation, profileData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, []);
    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_profile_title')}</Text>
                <TouchableOpacity 
                    style={[styles.previewBtn, { backgroundColor: c.primary + '10' }]}
                    onPress={handlePreview}
                >
                    <Ionicons name="eye-outline" size={18} color={c.primary} />
                    <Text style={[styles.previewBtnText, { color: c.primary }]}>Preview</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
            >
                {isLoadingProfile ? (
                    <View style={{ gap: 24 }}>
                        {/* Profile Card Skeleton */}
                        <View style={[styles.profileCard, { backgroundColor: c.bg2, shadowColor: '#000' }]}>
                            <View style={styles.profileMain}>
                                <SkeletonView width={80} height={80} borderRadius={40} />
                                <View style={{ gap: 8 }}>
                                    <SkeletonView width={150} height={24} />
                                    <SkeletonView width={200} height={16} />
                                </View>
                            </View>
                            <View style={[styles.statsRow, { borderTopColor: c.border }]}>
                                <View style={{ flex: 1, alignItems: 'center' }}><SkeletonView width={40} height={24} /></View>
                                <View style={{ flex: 1, alignItems: 'center' }}><SkeletonView width={40} height={24} /></View>
                                <View style={{ flex: 1, alignItems: 'center' }}><SkeletonView width={40} height={24} /></View>
                            </View>
                        </View>

                        {/* Card Skeletons */}
                        {[1, 2, 3].map(i => (
                            <View key={i} style={[styles.card, { backgroundColor: c.bg2 }]}>
                                <SkeletonView width={140} height={20} style={{ marginBottom: 20 }} />
                                <View style={{ gap: 16 }}>
                                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                        <SkeletonView width={36} height={36} borderRadius={10} />
                                        <View style={{ gap: 6 }}><SkeletonView width={100} height={16} /><SkeletonView width={160} height={12} /></View>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                        <SkeletonView width={36} height={36} borderRadius={10} />
                                        <View style={{ gap: 6 }}><SkeletonView width={100} height={16} /><SkeletonView width={160} height={12} /></View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <>
                        {/* Profile Card */}
                        <View style={[styles.profileCard, { backgroundColor: c.bg2, shadowColor: '#000' }]}>
                            <View style={styles.profileMain}>
                                <View style={styles.avatarWrapper}>
                                    <Image
                                        source={{ uri: profileData?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.name || 'User')}&background=F3F4F6&color=374151&size=256` }}
                                        style={styles.avatar}
                                    />
                                    <View style={[styles.badge, { backgroundColor: c.primary }]}>
                                        <Ionicons name="star" size={10} color="white" />
                                    </View>
                                </View>
                                <View style={styles.profileInfo}>
                                    <Text style={[styles.profileName, { color: c.text }]}>{profileData?.name || 'PetStay Host'}</Text>
                                    <Text style={[styles.profileEmail, { color: c.textMuted }]}>{user?.email}</Text>
                                </View>
                            </View>

                            <View style={[styles.statsRow, { borderTopColor: c.border }]}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNum, { color: c.text }]}>4.9</Text>
                                    <Text style={[styles.statLabel, { color: c.textMuted }]}>Rating</Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: c.border }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNum, { color: c.text }]}>24</Text>
                                    <Text style={[styles.statLabel, { color: c.textMuted }]}>Reviews</Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: c.border }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNum, { color: c.text }]}>100%</Text>
                                    <Text style={[styles.statLabel, { color: c.textMuted }]}>Response</Text>
                                </View>
                            </View>
                        </View>

                        {/* Section: Business Storefront */}
                        <View style={[styles.card, { backgroundColor: c.bg2 }]}>
                            <Text style={[styles.cardTitle, { color: c.text }]}>Business Storefront</Text>
                            <SettingItem 
                                icon="location-outline" 
                                label={i18n.t('host_profile_location')} 
                                subValue={profileData?.location || i18n.t('host_profile_none')}
                                onPress={() => setLocationModalVisible(true)}
                            />
                            <SettingItem 
                                icon="paw-outline" 
                                label={i18n.t('host_profile_services')} 
                                subValue={profileData?.services?.length ? profileData.services.map((s: string) => i18n.t(`service_${s}`)).join(', ') : i18n.t('host_profile_none')}
                                onPress={() => {}} // Could lead to a services editor
                            />
                            <SettingItem 
                                icon="document-text-outline" 
                                label={i18n.t('host_profile_bio')} 
                                subValue={profileData?.bio || "No bio set yet."}
                                onPress={() => {}} // Could lead to a bio editor
                            />
                        </View>

                        {/* Section: Operations */}
                        <View style={[styles.card, { backgroundColor: c.bg2 }]}>
                            <Text style={[styles.cardTitle, { color: c.text }]}>Operations & Schedule</Text>
                            <SettingItem 
                                icon="people-outline" 
                                label={i18n.t('host_profile_capacity')} 
                                subValue={profileData?.maxPetCapacity ? `${profileData.maxPetCapacity} ${i18n.t('booking_pets')}` : "Not set"}
                                onPress={openCapacityModal}
                            />
                            <SettingItem 
                                icon="calendar-outline" 
                                label={i18n.t('host_profile_vacation_dates')} 
                                subValue={profileData?.vacationDates?.length ? i18n.t('host_profile_vacation_days_count', { count: profileData.vacationDates.length }) : "Fully available"}
                                onPress={openVacationModal}
                            />
                            <SettingItem 
                                icon="heart-outline" 
                                label={i18n.t('host_profile_pets')} 
                                subValue={profileData?.petsAllowed?.length ? profileData.petsAllowed.map((p: string) => i18n.t(`pet_${p}`, { defaultValue: p })).join(', ') : "All pets"}
                                onPress={openAcceptedPetsModal} 
                            />
                        </View>

                        {/* Section: Account */}
                        <View style={[styles.card, { backgroundColor: c.bg2 }]}>
                            <Text style={[styles.cardTitle, { color: c.text }]}>Account & Support</Text>
                            <SettingItem 
                                icon="globe-outline" 
                                label={i18n.t('menu_language')} 
                                value={i18n.locale === 'en' ? 'English' : 'Français'}
                                onPress={openLanguageModal}
                            />
                            <SettingItem icon="help-circle-outline" label={i18n.t('menu_help')} onPress={() => {}} />
                            <SettingItem 
                                icon="log-out-outline" 
                                label={i18n.t('host_profile_logout')} 
                                isDestructive 
                                onPress={handleLogout} 
                                showArrow={false}
                            />
                        </View>

                        <Text style={[styles.version, { color: c.textMuted }]}>PetStay Host Edition • Version 1.0.0</Text>
                    </>
                )}
            </ScrollView>

            {/* Language Selection Modal */}
            <Modal
                transparent={true}
                visible={isLanguageModalVisible}
                animationType="none"
                onRequestClose={closeLanguageModal}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: fadeAnim }
                        ]}
                    >
                        <TouchableOpacity style={{ flex: 1 }} onPress={closeLanguageModal} activeOpacity={1} />
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.modalContent,
                            { backgroundColor: c.bg2, transform: [{ translateY }] }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: c.text }]}>{i18n.t('menu_language')}</Text>
                            <TouchableOpacity onPress={closeLanguageModal}>
                                <Ionicons name="close" size={24} color={c.text} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.languageOption, { borderBottomColor: c.border }]}
                            onPress={() => changeLanguage('en')}
                        >
                            <Text style={[styles.languageText, { color: c.text }]}>English</Text>
                            {locale === 'en' && <Ionicons name="checkmark" size={24} color={c.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.languageOption, { borderBottomColor: c.border }]}
                            onPress={() => changeLanguage('fr')}
                        >
                            <Text style={[styles.languageText, { color: c.text }]}>Français</Text>
                            {locale === 'fr' && <Ionicons name="checkmark" size={24} color={c.primary} />}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Capacity Modal */}
            <Modal
                visible={isCapacityModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCapacityModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: c.bg2 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: c.text }]}>
                                {i18n.t('host_capacity_title', { defaultValue: 'Set Max Capacity' })}
                            </Text>
                            <TouchableOpacity onPress={() => setCapacityModalVisible(false)}>
                                <Ionicons name="close" size={24} color={c.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={[styles.capacityDescription, { color: c.textMuted }]}>
                            {i18n.t('host_capacity_desc', { defaultValue: 'How many pets can you safely host at the same time?' })}
                        </Text>

                        <View style={styles.capacityControls}>
                            <TouchableOpacity
                                style={[styles.capacityBtn, { borderColor: c.border }]}
                                onPress={() => setEditingCapacity(Math.max(1, editingCapacity - 1))}
                            >
                                <Ionicons name="remove" size={24} color={c.text} />
                            </TouchableOpacity>
                            <Text style={[styles.capacityValue, { color: c.text }]}>{editingCapacity}</Text>
                            <TouchableOpacity
                                style={[styles.capacityBtn, { borderColor: c.border }]}
                                onPress={() => setEditingCapacity(editingCapacity + 1)}
                            >
                                <Ionicons name="add" size={24} color={c.text} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: c.primary }]} onPress={saveCapacity}>
                            <Text style={styles.saveButtonText}>{i18n.t('menu_save', { defaultValue: 'Save Configuration' })}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Vacation Modal */}
            <Modal
                visible={isVacationModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setVacationModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: c.bg2, maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: c.text }]}>
                                {i18n.t('host_profile_vacation_dates')}
                            </Text>
                            <TouchableOpacity onPress={() => setVacationModalVisible(false)}>
                                <Ionicons name="close" size={24} color={c.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={[styles.capacityDescription, { color: c.textMuted }]}>
                            {i18n.t('host_profile_vacation_description')}
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
                                <Ionicons name="chevron-back" size={24} color={c.text} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text }}>
                                {currentMonth.toLocaleString(i18n.locale || 'en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 8 }}>
                                <Ionicons name="chevron-forward" size={24} color={c.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                                <Text key={d} style={{ width: '14.28%', textAlign: 'center', color: c.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{d}</Text>
                            ))}
                            {calendarDays.map((date, index) => {
                                if (!date) return <View key={`empty-${index}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
                                
                                const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                                const isSelected = editingVacationDates.includes(dateStr);
                                const isPast = date < new Date(new Date().setHours(0,0,0,0));

                                return (
                                    <View key={index} style={{ width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                                        <TouchableOpacity
                                            style={{
                                                width: 36,
                                                height: 36,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: isSelected ? c.primary : 'transparent',
                                                borderRadius: 18,
                                                opacity: isPast ? 0.3 : 1
                                            }}
                                            onPress={() => toggleVacationDate(date)}
                                            disabled={isPast}
                                        >
                                            <Text style={{
                                                color: isSelected ? 'white' : c.text,
                                                fontWeight: isSelected ? 'bold' : 'normal'
                                            }}>
                                                {date.getDate()}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>

                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: c.primary }]} onPress={saveVacationDates}>
                            <Text style={styles.saveButtonText}>{i18n.t('menu_save', { defaultValue: 'Save Configuration' })}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Accepted Pets Modal */}
            <Modal
                visible={isAcceptedPetsModalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={closeAcceptedPetsModal}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: fadeAnim }
                        ]}
                    >
                        <TouchableOpacity style={{ flex: 1 }} onPress={closeAcceptedPetsModal} activeOpacity={1} />
                    </Animated.View>

                    <Animated.View style={[styles.modalContent, { backgroundColor: c.bg2, transform: [{ translateY }] }]}>
                        {/* Handle bar */}
                        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border }} />
                        </View>

                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: c.text }]}>
                                {i18n.t('host_profile_pets')}
                            </Text>
                            <TouchableOpacity 
                                onPress={closeAcceptedPetsModal}
                                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.border + '60', justifyContent: 'center', alignItems: 'center' }}
                            >
                                <Ionicons name="close" size={18} color={c.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={[styles.capacityDescription, { color: c.textMuted, textAlign: 'left', marginBottom: 20 }]}>
                            {i18n.t('host_accepted_pets_desc', { defaultValue: 'Choose which furry (or scaly) friends you welcome into your home.' })}
                        </Text>

                        <View style={{ gap: 12, marginBottom: 28 }}>
                            {[
                                { key: 'dogs', icon: 'dog' as keyof typeof MaterialCommunityIcons.glyphMap, desc: 'Dogs of all breeds and sizes' },
                                { key: 'cats', icon: 'cat' as keyof typeof MaterialCommunityIcons.glyphMap, desc: 'Indoor and outdoor cats' },
                                { key: 'exotics', icon: 'turtle' as keyof typeof MaterialCommunityIcons.glyphMap, desc: 'Birds, reptiles, rabbits & more' },
                            ].map((pet) => {
                                const isSelected = editingAcceptedPets.includes(pet.key);
                                return (
                                    <TouchableOpacity
                                        key={pet.key}
                                        activeOpacity={0.7}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: 16,
                                            borderWidth: isSelected ? 1.5 : 1,
                                            borderColor: isSelected ? c.primary : c.border,
                                            borderRadius: 16,
                                            backgroundColor: isSelected ? c.primary + '08' : 'transparent',
                                        }}
                                        onPress={() => toggleAcceptedPet(pet.key)}
                                    >
                                        {/* Icon */}
                                        <View style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            backgroundColor: isSelected ? c.primary + '18' : c.border + '40',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 14,
                                        }}>
                                            <MaterialCommunityIcons name={pet.icon} size={24} color={isSelected ? c.primary : c.textMuted} />
                                        </View>

                                        {/* Text content */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                fontSize: 16,
                                                fontFamily: AppFonts.bodyBold,
                                                color: c.text,
                                            }}>
                                                {i18n.t(`pet_${pet.key}`, { defaultValue: pet.key.charAt(0).toUpperCase() + pet.key.slice(1) })}
                                            </Text>
                                            <Text style={{
                                                fontSize: 13,
                                                fontFamily: AppFonts.body,
                                                color: c.textMuted,
                                                marginTop: 2,
                                            }}>
                                                {i18n.t(`pet_${pet.key}_desc`, { defaultValue: pet.desc })}
                                            </Text>
                                        </View>

                                        {/* Check indicator */}
                                        <View style={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: 13,
                                            borderWidth: isSelected ? 0 : 1.5,
                                            borderColor: c.border,
                                            backgroundColor: isSelected ? c.primary : 'transparent',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                            {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveButton, { backgroundColor: c.primary }]} 
                            onPress={saveAcceptedPets}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.saveButtonText}>{i18n.t('menu_save', { defaultValue: 'Save Configuration' })}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
            
            {/* Location Picker Modal */}
            <LocationPickerModal
                visible={isLocationModalVisible}
                onClose={() => setLocationModalVisible(false)}
                initialCoords={profileData?.locationCoords}
                onConfirm={handleSaveLocation}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontFamily: AppFonts.title,
    },
    previewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    previewBtnText: {
        fontSize: 14,
        fontFamily: AppFonts.bodyBold,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    profileCard: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        ...CardShadow,
    },
    profileMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 20,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    badge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 22,
        fontFamily: AppFonts.title,
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        fontFamily: AppFonts.body,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNum: {
        fontSize: 18,
        fontFamily: AppFonts.title,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: AppFonts.body,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
    },
    card: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        ...CardShadow,
    },
    cardTitle: {
        fontSize: 17,
        fontFamily: AppFonts.title,
        marginBottom: 16,
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        fontFamily: AppFonts.body,
        marginTop: 20,
        marginBottom: 40,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: AppFonts.title,
    },
    capacityDescription: {
        fontSize: 14,
        fontFamily: AppFonts.body,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    capacityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 32,
    },
    capacityBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    capacityValue: {
        fontSize: 32,
        fontFamily: AppFonts.title,
    },
    saveButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    },
    languageOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    languageText: {
        fontSize: 16,
        fontFamily: AppFonts.body,
    },
});
