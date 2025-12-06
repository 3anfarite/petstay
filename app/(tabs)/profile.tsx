import { useColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg2 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Profile</Text>
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
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Account Settings</Text>
          <MenuItem icon="person-outline" label="Personal Information" />
          <MenuItem icon="card-outline" label="Payments & Payouts" />
          <MenuItem icon="notifications-outline" label="Notifications" />
          <MenuItem icon="shield-checkmark-outline" label="Privacy & Sharing" />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Hosting</Text>
          <MenuItem icon="home-outline" label="Switch to Hosting" />
          <MenuItem icon="list-outline" label="List your space" />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Support</Text>
          <MenuItem icon="help-circle-outline" label="Get Help" />
          <MenuItem icon="chatbox-ellipses-outline" label="Give us Feedback" />
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <MenuItem
            icon="create-outline"
            label="Edit Profile"
            onPress={() => console.log('Edit Profile')}
          />
          <MenuItem
            icon="log-out-outline"
            label="Log Out"
            isDestructive
            onPress={() => console.log('Log out')}
          />
        </View>

        <Text style={[styles.version, { color: c.textMuted }]}>Version 1.0.0</Text>

      </ScrollView>
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
});