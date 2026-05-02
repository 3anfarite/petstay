import { useLanguage } from '@/components/LanguageProvider';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { db } from '@/lib/firebaseConfig';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { AuthService } from '@/lib/authService';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=F3F4F6&color=374151&size=256';

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  isDestructive?: boolean;
  value?: string;
};

const MenuItem = ({ icon, label, onPress, isDestructive, value }: MenuItemProps) => {
  const c = useColors();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: c.border }]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={isDestructive ? c.error : c.text}
        />
        <Text style={[
          styles.menuItemLabel,
          { color: isDestructive ? c.error : c.text }
        ]}>
          {label}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && <Text style={[styles.menuItemValue, { color: c.textMuted }]}>{value}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const SkeletonView = ({ width, height, borderRadius, style }: any) => {
  const c = useColors();
  const animatedValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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

export default function Profile() {
  const c = useColors();
  const { locale, setLocale } = useLanguage();
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const router = useRouter(); // Added router for navigation

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

  React.useEffect(() => {
    fetchProfile();
  }, [user, locale]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, []);

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
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const screenHeight = Dimensions.get('window').height;
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg2 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>{i18n.t('profile_title')}</Text>
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
                <Text style={[styles.name, { color: c.text }]}>{profileData?.name || 'PetStay Member'}</Text>
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{i18n.t('section_hosting')}</Text>
          <MenuItem icon="home-outline" label={i18n.t('menu_switch_hosting')} />
          <MenuItem icon="list-outline" label={i18n.t('menu_list_space')} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{i18n.t('section_support')}</Text>
          <MenuItem icon="help-circle-outline" label={i18n.t('menu_help')} />
          <MenuItem icon="chatbox-ellipses-outline" label={i18n.t('menu_feedback')} />
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <MenuItem
            icon="create-outline"
            label={i18n.t('profile_edit')}
            onPress={() => console.log('Edit Profile')}
          />
          <MenuItem
            icon="log-out-outline"
            label={i18n.t('profile_logout')}
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
          {/* Animated Backdrop */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: fadeAnim }
            ]}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={closeLanguageModal} activeOpacity={1} />
          </Animated.View>

          {/* Animated Content */}
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemValue: {
    fontSize: 14,
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