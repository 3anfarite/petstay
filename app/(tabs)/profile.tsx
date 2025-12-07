import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_USER = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
};

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

export default function Profile() {
  const c = useColors();
  const [locale, setLocale] = useState(i18n.locale);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);

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
    i18n.locale = lang;
    setLocale(lang);
    closeLanguageModal();
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

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* User Info List Item */}
        <TouchableOpacity style={[styles.userRow, { borderBottomColor: c.border }]}>
          <Image
            source={{ uri: DUMMY_USER.avatar }}
            style={styles.avatar}
          />
          <View style={styles.userInfoText}>
            <Text style={[styles.name, { color: c.text }]}>{DUMMY_USER.name}</Text>
            <Text style={[styles.email, { color: c.textMuted }]}>{DUMMY_USER.email}</Text>
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
            onPress={() => console.log('Log out')}
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
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
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