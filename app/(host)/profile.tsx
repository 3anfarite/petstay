
import { useLanguage } from '@/components/LanguageProvider';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    return (
        <TouchableOpacity style={[menuItemStyles.menuItem, { borderBottomColor: c.border }]} onPress={onPress}>
            <View style={menuItemStyles.leftContent}>
                <Ionicons name={icon} size={24} color={isDestructive ? c.error : c.text} />
                <Text style={[menuItemStyles.menuItemLabel, { color: isDestructive ? c.error : c.text }]}>{label}</Text>
            </View>
            <View style={menuItemStyles.rightContent}>
                {value && <Text style={[menuItemStyles.menuItemValue, { color: c.textMuted }]}>{value}</Text>}
                <Ionicons name="chevron-forward-outline" size={20} color={c.textMuted} />
            </View>
        </TouchableOpacity>
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

    const screenHeight = Dimensions.get('window').height;
    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [screenHeight, 0],
    });

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_profile_title')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* User Info List Item */}
                <TouchableOpacity style={[styles.userRow, { borderBottomColor: c.border }]}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' }} // Mock Avatar
                        style={styles.avatar}
                    />
                    <View style={styles.userInfoText}>
                        <Text style={[styles.name, { color: c.text }]}>Host User</Text>
                        <Text style={[styles.email, { color: c.textMuted }]}>host@test.com</Text>
                    </View>
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

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{i18n.t('section_hosting')}</Text>
                    {/* Navigate to Listings Screen from here */}
                    <MenuItem
                        icon="list-outline"
                        label={i18n.t('host_tab_listings')}
                        onPress={() => router.push('/(host)/listings')}
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
                        onPress={() => router.replace('/auth/welcome')}
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
    scrollContent: {
        paddingBottom: 40,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        marginTop: 8,
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
