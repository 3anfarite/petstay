import { useLanguage } from '@/components/LanguageProvider';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { db } from '@/lib/firebaseConfig';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthService } from '@/lib/authService';

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

// MenuItem component definition
interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, value, onPress, isDestructive }) => {
    const c = useColors();
    const ContainerStr = onPress ? TouchableOpacity : View;

    return (
        <ContainerStr
            style={[menuItemStyles.menuItem, { borderBottomColor: c.border }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={menuItemStyles.leftContent}>
                <Ionicons name={icon} size={24} color={isDestructive ? c.error : c.text} />
                <Text style={[menuItemStyles.menuItemLabel, { color: isDestructive ? c.error : c.text }]}>{label}</Text>
            </View>
            <View style={menuItemStyles.rightContent}>
                {value && <Text style={[menuItemStyles.menuItemValue, { color: c.textMuted }]}>{value}</Text>}
                {onPress && <Ionicons name="chevron-forward-outline" size={20} color={c.textMuted} />}
            </View>
        </ContainerStr>
    );
};

const menuItemStyles = StyleSheet.create({
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuItemLabel: {
        fontSize: 16,
    },
    menuItemValue: {
        fontSize: 16,
    },
});

export default function HostProfile() {
    const c = useColors();
    const insets = useSafeAreaInsets();
    const { locale, setLocale } = useLanguage();
    const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
    
    // Capacity Modal State
    const [isCapacityModalVisible, setCapacityModalVisible] = useState(false);
    const [editingCapacity, setEditingCapacity] = useState(1);

    const router = useRouter(); // Added router for navigation

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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_profile_title')}</Text>
            </View>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
            >

                {/* User Info List Item */}
                <TouchableOpacity style={[styles.userRow, { borderBottomColor: c.border }]} disabled={isLoadingProfile}>
                    {isLoadingProfile ? (
                        <>
                            <SkeletonView width={64} height={64} borderRadius={32} style={styles.avatar} />
                            <View style={styles.userInfoText}>
                                <SkeletonView width={140} height={24} style={{ marginBottom: 6 }} />
                                <SkeletonView width={200} height={16} />
                            </View>
                        </>
                    ) : (
                        <>
                            <Image
                                source={{ uri: profileData?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.name || 'User')}&background=F3F4F6&color=374151&size=256` }}
                                style={styles.avatar}
                            />
                            <View style={styles.userInfoText}>
                                <Text style={[styles.name, { color: c.text }]}>{profileData?.name || 'PetStay Host'}</Text>
                                <Text style={[styles.email, { color: c.textMuted }]}>{user?.email}</Text>
                            </View>
                        </>
                    )}
                </TouchableOpacity>

                {/* Menu Sections */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{i18n.t('section_account')}</Text>
                    <MenuItem icon="person-outline" label={i18n.t('menu_personal_info')} />
                    <MenuItem icon="card-outline" label={i18n.t('menu_payments')} />
                    <MenuItem icon="notifications-outline" label={i18n.t('menu_notifications')} />
                    <MenuItem icon="shield-checkmark-outline" label={i18n.t('menu_privacy')} />
                    <MenuItem
                        icon="globe-outline"
                        label={i18n.t('menu_language')}
                        value={i18n.locale === 'en' ? 'English' : 'Français'}
                        onPress={openLanguageModal}
                    />
                </View>

                <View style={[styles.section, { marginTop: 8 }]}>
                    <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{i18n.t('section_hosting')}</Text>

                    <MenuItem
                        icon="location-outline"
                        label={i18n.t('host_profile_location')}
                        value={profileData?.location || i18n.t('host_profile_none')}
                    />
                    <MenuItem
                        icon="people-outline"
                        label={i18n.t('host_profile_capacity', { defaultValue: 'Max Capacity' })}
                        value={profileData?.maxPetCapacity ? `${profileData.maxPetCapacity} Pets` : 'Not Set'}
                        onPress={openCapacityModal}
                    />
                    <MenuItem
                        icon="paw-outline"
                        label={i18n.t('host_profile_services')}
                        value={profileData?.services?.length ? profileData.services.map((s: string) => i18n.t(`service_${s}`)).join(', ') : i18n.t('host_profile_none')}
                    />
                    <MenuItem
                        icon="heart-outline"
                        label={i18n.t('host_profile_pets')}
                        value={profileData?.petsAllowed?.length ? profileData.petsAllowed.map((p: string) => i18n.t(`pet_${p}`)).join(', ') : i18n.t('host_profile_none')}
                    />
                    <MenuItem
                        icon="document-text-outline"
                        label={i18n.t('host_profile_bio')}
                        value={profileData?.bio ? i18n.t('host_profile_configured') : i18n.t('host_profile_none')}
                    />

                    <MenuItem icon="stats-chart-outline" label={i18n.t('host_menu_insights')} />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{i18n.t('section_support')}</Text>
                    <MenuItem icon="help-circle-outline" label={i18n.t('menu_help')} />
                    <MenuItem icon="chatbox-ellipses-outline" label={i18n.t('menu_feedback')} />
                </View>

                <View style={[styles.section, { marginBottom: 40 }]}>
                    <MenuItem
                        icon="log-out-outline"
                        label={i18n.t('host_profile_logout')}
                        isDestructive
                        onPress={handleLogout}
                    />
                </View>

                <Text style={[styles.version, { color: c.textMuted }]}>Version 1.0.0</Text>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    hostIdentityCard: {
        marginHorizontal: 20,
        marginTop: 16,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    hostLocation: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    hostBio: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 20,
    },
    tagsArea: {
        marginTop: 4,
    },
    tagsHeader: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    langText: {
        fontSize: 16,
        fontWeight: '500',
    },
    capacityDescription: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 16,
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
        fontWeight: '700',
    },
    saveButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 0,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 16,
    },
    userInfoText: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 20,
        marginBottom: 40,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    languageOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    languageText: {
        fontSize: 16,
    },
});
